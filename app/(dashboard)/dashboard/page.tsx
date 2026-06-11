import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { PLAN_LIMITS } from '@/lib/limits'
import DashboardClient from '@/components/dashboard-client'
import type { ProjectData, ActivityItem } from '@/components/dashboard-client'

const ACCENTS = ['#3b82f6', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const DAY_MS = 24 * 60 * 60 * 1000

function formatAgo(date: Date): string {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  return `${Math.floor(diffH / 24)}d`
}

function runPassRate(results: { result: string }[]): number | null {
  const relevant = results.filter(r => r.result !== 'NOT_RUN')
  if (relevant.length === 0) return null
  return Math.round((relevant.filter(r => r.result === 'PASSED').length / relevant.length) * 100)
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [projects, user, rawActivity, heatActivity, aiThisWeek, recentRuns, rawRunResults] = await Promise.all([
    db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { testCases: true, bugReports: true, regressionSuites: true } },
        bugReports: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
          select: { severity: true },
        },
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, name: true, email: true, plan: true, aiCallsToday: true },
    }),
    db.activityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        project: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    db.activityEvent.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 14 * DAY_MS) } },
      select: { createdAt: true },
    }),
    db.generationSession.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - 7 * DAY_MS) } },
    }),
    db.suiteRun.findMany({
      where: { status: 'COMPLETED', suite: { project: { userId } } },
      orderBy: { startedAt: 'desc' },
      take: 200,
      select: {
        startedAt: true,
        suite: { select: { projectId: true } },
        results: { select: { result: true } },
      },
    }),
    db.suiteRunResult.findMany({
      where: {
        run: { suite: { project: { userId } }, status: 'COMPLETED' },
        result: { in: ['PASSED', 'FAILED'] },
      },
      select: {
        testCaseId: true,
        result: true,
        testCase: { select: { title: true, project: { select: { name: true } } } },
      },
      take: 3000,
    }),
  ])

  // Onboarding redirect for brand-new users
  if (projects.length === 0 && user && Date.now() - user.createdAt.getTime() < 5 * 60 * 1000) {
    redirect('/onboarding')
  }

  // Group completed runs by project
  const runsByProject = new Map<string, typeof recentRuns>()
  for (const run of recentRuns) {
    const pid = run.suite.projectId
    if (!runsByProject.has(pid)) runsByProject.set(pid, [])
    runsByProject.get(pid)!.push(run)
  }

  function projectSparkline(projectId: string): number[] {
    const runs = (runsByProject.get(projectId) ?? []).slice(0, 7).reverse()
    if (runs.length === 0) {
      const seed = projectId.charCodeAt(0)
      return Array.from({ length: 7 }, (_, i) =>
        Math.round(60 + 30 * Math.abs(Math.sin(i * 1.3 + seed)))
      )
    }
    return runs.map(r => runPassRate(r.results) ?? 0)
  }

  function projectPassRate(projectId: string): number | null {
    const runs = runsByProject.get(projectId) ?? []
    return runs.length === 0 ? null : runPassRate(runs[0].results)
  }

  // Overall pass rate
  const allRelevant = recentRuns.flatMap(r => r.results).filter(r => r.result !== 'NOT_RUN')
  const passRate = allRelevant.length === 0
    ? 0
    : Math.round((allRelevant.filter(r => r.result === 'PASSED').length / allRelevant.length) * 100)
  const hasRunData = allRelevant.length > 0

  // Bugs by severity (open / in-progress)
  const bugsBySeverity = { P0: 0, P1: 0, P2: 0, P3: 0 }
  const sevMap: Record<string, keyof typeof bugsBySeverity> = {
    CRITICAL: 'P0', HIGH: 'P1', MEDIUM: 'P2', LOW: 'P3',
  }
  for (const p of projects) {
    for (const bug of p.bugReports) {
      bugsBySeverity[sevMap[bug.severity]] += 1
    }
  }

  // Project data
  const projectsData: ProjectData[] = projects.map((p, i) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    updatedAt: formatAgo(p.updatedAt),
    tests: p._count.testCases,
    bugs: p._count.bugReports,
    suites: p._count.regressionSuites,
    openBugs: p.bugReports.length,
    openCritical: p.bugReports.filter(b => b.severity === 'CRITICAL').length,
    openHigh: p.bugReports.filter(b => b.severity === 'HIGH').length,
    sparkline: projectSparkline(p.id),
    passRate: projectPassRate(p.id),
    accent: ACCENTS[i % ACCENTS.length],
    mono: p.name.slice(0, 2).toUpperCase(),
  }))

  // Heatmap: 14 days × 7 rows, row-major (index = row * 14 + col, col = day)
  const nowMs = Date.now()
  const dayCounts = Array.from({ length: 14 }, (_, d) => {
    const dayStart = new Date(nowMs - (13 - d) * DAY_MS)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + DAY_MS)
    return heatActivity.filter(e => e.createdAt >= dayStart && e.createdAt < dayEnd).length
  })
  const heatmap = Array.from({ length: 98 }, (_, i) => {
    const col = i % 14
    const row = Math.floor(i / 14)
    return Math.round(dayCounts[col] * (0.4 + 0.6 * Math.abs(Math.sin(row * 1.7 + col * 0.4))))
  })

  // Activity feed
  const activity: ActivityItem[] = rawActivity.map(e => {
    const [ns, verb] = e.action.split('.')
    const verbLabel = (
      verb === 'created' ? 'created' :
      verb === 'updated' ? 'updated' :
      verb === 'deleted' ? 'deleted' :
      verb === 'status_changed' ? 'changed status of' :
      verb === 'exported' ? 'exported' :
      verb === 'run_completed' ? 'completed a run for' :
      verb?.replace(/_/g, ' ') ?? 'updated'
    )
    const typeMap: Record<string, string> = {
      test_case: 'test_case', bug: 'bug', suite: 'suite',
      generation: 'generation', webhook: 'webhook',
    }
    const whatMap: Record<string, string> = {
      test_case: 'a test case', bug: 'a bug',
      suite: 'a suite', generation: 'test cases', webhook: 'a webhook',
    }
    return {
      who: e.user.name?.split(' ')[0] ?? e.user.email?.split('@')[0] ?? 'Someone',
      verb: verbLabel,
      what: whatMap[ns] ?? '',
      when: formatAgo(e.createdAt),
      project: e.project.name,
      type: typeMap[ns] ?? 'test_case',
    }
  })

  // Flaky tests: test cases with mixed PASS/FAIL results across runs
  const flakyGroups = new Map<string, { title: string; project: string; passed: number; failed: number }>()
  for (const r of rawRunResults) {
    if (!flakyGroups.has(r.testCaseId)) {
      flakyGroups.set(r.testCaseId, {
        title: r.testCase.title,
        project: r.testCase.project.name,
        passed: 0,
        failed: 0,
      })
    }
    const entry = flakyGroups.get(r.testCaseId)!
    if (r.result === 'PASSED') entry.passed++
    else entry.failed++
  }
  const flakyTests = Array.from(flakyGroups.entries())
    .filter(([, e]) => e.passed > 0 && e.failed > 0 && e.passed + e.failed >= 3)
    .map(([, e]) => ({
      title: e.title,
      project: e.project,
      failRate: Math.round((e.failed / (e.passed + e.failed)) * 100),
      runs: e.passed + e.failed,
    }))
    .sort((a, b) => b.failRate - a.failRate)
    .slice(0, 5)

  // User / plan info
  const plan = (user?.plan ?? 'FREE') as keyof typeof PLAN_LIMITS
  const aiLimit = PLAN_LIMITS[plan]?.aiCredits ?? 5
  const userName = user?.name ?? 'User'

  return (
    <DashboardClient
      projects={projectsData}
      bugsBySeverity={bugsBySeverity}
      heatmap={heatmap}
      aiThisWeek={aiThisWeek}
      aiToday={user?.aiCallsToday ?? 0}
      aiLimit={aiLimit}
      activity={activity}
      flakyTests={flakyTests}
      user={{
        name: userName,
        email: user?.email ?? null,
        plan,
        initials: userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      }}
      totalTests={projects.reduce((s, p) => s + p._count.testCases, 0)}
      totalBugs={Object.values(bugsBySeverity).reduce((a, b) => a + b, 0)}
      passRate={passRate}
      hasRunData={hasRunData}
    />
  )
}
