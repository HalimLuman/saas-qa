import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BarChart2, TrendingUp, Bug, Sparkles, FlaskConical, Flame } from 'lucide-react'

const DAY_MS = 24 * 60 * 60 * 1000
const ACCENTS = ['#3b82f6', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function passColor(rate: number | null) {
  if (rate == null) return '#94a3b8'
  if (rate >= 95) return '#22c55e'
  if (rate >= 85) return '#3b82f6'
  if (rate >= 70) return '#f59e0b'
  return '#ef4444'
}

export default async function InsightsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [projects, recentRuns, bugReports, genSessions, activityLast30] = await Promise.all([
    db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { testCases: true, bugReports: true, regressionSuites: true } },
      },
    }),
    db.suiteRun.findMany({
      where: { status: 'COMPLETED', suite: { project: { userId } } },
      orderBy: { startedAt: 'desc' },
      take: 500,
      select: {
        id: true,
        startedAt: true,
        suite: { select: { projectId: true, name: true, project: { select: { name: true } } } },
        results: { select: { result: true } },
      },
    }),
    db.bugReport.findMany({
      where: { project: { userId } },
      select: { severity: true, status: true, projectId: true, createdAt: true },
    }),
    db.generationSession.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 30 * DAY_MS) } },
      select: { createdAt: true, projectId: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.activityEvent.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 30 * DAY_MS) } },
      select: { createdAt: true },
    }),
  ])

  // Pass rate per project (last run)
  const latestRunByProject = new Map<string, typeof recentRuns[0]>()
  for (const run of recentRuns) {
    const pid = run.suite.projectId
    if (!latestRunByProject.has(pid)) latestRunByProject.set(pid, run)
  }

  function runPassRate(results: { result: string }[]) {
    const rel = results.filter(r => r.result !== 'NOT_RUN')
    return rel.length === 0 ? null : Math.round(rel.filter(r => r.result === 'PASSED').length / rel.length * 100)
  }

  // Overall stats
  const totalTests = projects.reduce((s, p) => s + p._count.testCases, 0)
  const totalBugs = bugReports.filter(b => b.status === 'OPEN' || b.status === 'IN_PROGRESS').length
  const totalSuites = projects.reduce((s, p) => s + p._count.regressionSuites, 0)
  const totalRuns = recentRuns.length

  // Overall pass rate from most recent runs per project
  const allLatest = Array.from(latestRunByProject.values())
  const allRelevant = allLatest.flatMap(r => r.results).filter(r => r.result !== 'NOT_RUN')
  const overallPassRate = allRelevant.length === 0 ? null
    : Math.round(allRelevant.filter(r => r.result === 'PASSED').length / allRelevant.length * 100)

  // Bug severity breakdown
  const sevMap: Record<string, string> = { CRITICAL: 'P0', HIGH: 'P1', MEDIUM: 'P2', LOW: 'P3' }
  const openBugsBySev = { P0: 0, P1: 0, P2: 0, P3: 0 }
  for (const b of bugReports) {
    if (b.status === 'OPEN' || b.status === 'IN_PROGRESS') {
      const key = sevMap[b.severity] as keyof typeof openBugsBySev
      openBugsBySev[key]++
    }
  }

  // Pass rate trend — last 14 days (one data point per day)
  const trend14: { date: string; rate: number | null }[] = Array.from({ length: 14 }, (_, i) => {
    const dayStart = new Date(Date.now() - (13 - i) * DAY_MS)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + DAY_MS)
    const dayRuns = recentRuns.filter(r => r.startedAt >= dayStart && r.startedAt < dayEnd)
    if (dayRuns.length === 0) return { date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), rate: null }
    const rel = dayRuns.flatMap(r => r.results).filter(r => r.result !== 'NOT_RUN')
    return {
      date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rate: rel.length === 0 ? null : Math.round(rel.filter(r => r.result === 'PASSED').length / rel.length * 100),
    }
  })

  // Activity heatmap — last 14 days
  const heatCounts = Array.from({ length: 14 }, (_, i) => {
    const dayStart = new Date(Date.now() - (13 - i) * DAY_MS)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + DAY_MS)
    return activityLast30.filter(e => e.createdAt >= dayStart && e.createdAt < dayEnd).length
  })
  const heatMax = Math.max(...heatCounts, 1)

  // Per-project stats
  const projectStats = projects.map((p, i) => {
    const latestRun = latestRunByProject.get(p.id)
    const rate = latestRun ? runPassRate(latestRun.results) : null
    const openBugs = bugReports.filter(b => b.projectId === p.id && (b.status === 'OPEN' || b.status === 'IN_PROGRESS')).length
    const runs = recentRuns.filter(r => r.suite.projectId === p.id).length
    return { ...p, rate, openBugs, runs, accent: ACCENTS[i % ACCENTS.length] }
  }).sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))

  // AI usage per day (last 14 days)
  const aiByDay = Array.from({ length: 14 }, (_, i) => {
    const dayStart = new Date(Date.now() - (13 - i) * DAY_MS)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + DAY_MS)
    return genSessions.filter(s => s.createdAt >= dayStart && s.createdAt < dayEnd).length
  })
  const aiMax = Math.max(...aiByDay, 1)

  const SEV_COLORS = { P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#94a3b8' }
  const totalOpenBugs = Object.values(openBugsBySev).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page header */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)' }} />
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(59,130,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <BarChart2 className="h-5 w-5" style={{ color: '#6366f1' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Insights</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''} · {totalTests.toLocaleString()} tests · {totalRuns} runs
            </p>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total tests', value: totalTests.toLocaleString(), icon: <FlaskConical className="h-4 w-4" />, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { label: 'Open bugs', value: totalBugs.toString(), icon: <Bug className="h-4 w-4" />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Test suites', value: totalSuites.toString(), icon: <BarChart2 className="h-4 w-4" />, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
          { label: 'AI generations (30d)', value: genSessions.length.toString(), icon: <Sparkles className="h-4 w-4" />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pass rate trend + Bug severity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        {/* Pass rate trend */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={14} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Pass rate · 14 days</span>
            {overallPassRate != null && (
              <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: passColor(overallPassRate), fontVariantNumeric: 'tabular-nums' }}>
                {overallPassRate}%
              </span>
            )}
          </div>
          {trend14.some(d => d.rate != null) ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64 }}>
              {trend14.map((d, i) => {
                const h = d.rate != null ? Math.max(6, (d.rate / 100) * 64) : 6
                const c = d.rate != null ? passColor(d.rate) : 'rgba(99,120,200,0.15)'
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', height: h, borderRadius: 4, background: c, opacity: d.rate != null ? 0.85 : 0.3, transition: 'height .3s', animation: `qa-rise .5s ${i * 0.03}s ease-out both`, transformOrigin: 'bottom' }} />
                    {i % 4 === 0 && (
                      <span style={{ fontSize: 9, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{d.date}</span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
              No run data yet
            </div>
          )}
        </div>

        {/* Bug severity */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bug size={14} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Open bugs</span>
            <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {totalOpenBugs}
            </span>
          </div>
          {totalOpenBugs > 0 ? (
            <>
              <div style={{ height: 8, borderRadius: 99, overflow: 'hidden', background: 'rgba(99,120,200,0.1)', display: 'flex', marginBottom: 12 }}>
                {(Object.entries(openBugsBySev) as [keyof typeof SEV_COLORS, number][]).map(([k, v]) =>
                  v > 0 ? <div key={k} style={{ width: `${v / totalOpenBugs * 100}%`, background: SEV_COLORS[k], animation: 'qa-rise .7s ease-out both' }} /> : null
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(Object.entries(openBugsBySev) as [keyof typeof SEV_COLORS, number][]).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: SEV_COLORS[k], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                    <div style={{ width: 56, height: 4, borderRadius: 99, background: 'rgba(99,120,200,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${v / totalOpenBugs * 100}%`, background: SEV_COLORS[k], animation: 'qa-rise .7s ease-out both', transformOrigin: 'left' }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0', color: '#22c55e', fontWeight: 600, fontSize: 13 }}>No open bugs ✓</div>
          )}
        </div>
      </div>

      {/* AI usage + Activity heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* AI usage */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Sparkles size={14} style={{ color: '#8b5cf6' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>AI generations · 14 days</span>
            <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              {aiByDay.reduce((a, b) => a + b, 0)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
            {aiByDay.map((v, i) => (
              <div key={i} style={{
                flex: 1,
                height: Math.max(4, (v / aiMax) * 48),
                borderRadius: 3,
                background: v > 0 ? 'linear-gradient(180deg, #a78bfa, #7c3aed)' : 'rgba(99,120,200,0.12)',
                animation: `qa-rise .5s ${i * 0.03}s ease-out both`,
                transformOrigin: 'bottom',
              }} />
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>14 days ago</span><span>Today</span>
          </div>
        </div>

        {/* Activity heatmap */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Flame size={14} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Activity · 14 days</span>
            <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              {activityLast30.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
            {heatCounts.map((v, i) => (
              <div key={i} style={{
                flex: 1,
                height: Math.max(4, (v / heatMax) * 48),
                borderRadius: 3,
                background: v > 0 ? 'linear-gradient(180deg, #fbbf24, #f59e0b)' : 'rgba(99,120,200,0.12)',
                animation: `qa-rise .5s ${i * 0.03}s ease-out both`,
                transformOrigin: 'bottom',
              }} />
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>14 days ago</span><span>Today</span>
          </div>
        </div>
      </div>

      {/* Per-project health table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlaskConical size={14} style={{ color: '#10b981' }} />
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Project health</h2>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{projects.length}</span>
        </div>

        {projects.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            No projects yet. <Link href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Create one →</Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 80px 80px 80px 80px 100px', gap: 12, padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
              <div>Project</div><div>Tests</div><div>Open bugs</div><div>Runs</div><div>Suites</div><div>Pass rate</div>
            </div>
            {projectStats.map((p) => (
              <Link key={p.id} href={`/project/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                  className="hover-row"
                  style={{ display: 'grid', gridTemplateColumns: '1.8fr 80px 80px 80px 80px 100px', gap: 12, padding: '11px 20px', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${p.accent}20`, color: p.accent, border: `1px solid ${p.accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </div>
                  <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', fontWeight: 600 }}>{p._count.testCases}</div>
                  <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: p.openBugs > 0 ? '#ef4444' : 'var(--text-tertiary)', fontWeight: p.openBugs > 0 ? 700 : 400 }}>{p.openBugs || '—'}</div>
                  <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', fontWeight: 600 }}>{p.runs}</div>
                  <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', fontWeight: 600 }}>{p._count.regressionSuites}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(99,120,200,0.1)', overflow: 'hidden' }}>
                      {p.rate != null && (
                        <div style={{ height: '100%', width: `${p.rate}%`, background: passColor(p.rate), borderRadius: 99, animation: 'qa-rise .8s ease-out both', transformOrigin: 'left' }} />
                      )}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: passColor(p.rate), fontVariantNumeric: 'tabular-nums', width: 36, textAlign: 'right', flexShrink: 0 }}>
                      {p.rate != null ? `${p.rate}%` : '—'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
