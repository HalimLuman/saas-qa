import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import {
  ArrowLeft, Bug, FlaskConical, Layers, CheckCircle2,
  Sparkles, Plus, Map, Clock, ArrowRight, AlertTriangle,
} from 'lucide-react'
import ProjectQuickActions from '@/components/project-quick-actions'
import ProjectOverviewActions from '@/components/project-overview-actions'
import { formatDate, timeAgo } from '@/lib/utils'

// ── Health score helpers ──────────────────────────────────────────────────────

function computeHealthScore({
  totalTests,
  approvedTests,
  openBugs,
  totalBugs,
  totalAreas,
  areasWithTests,
}: {
  totalTests: number
  approvedTests: number
  openBugs: number
  totalBugs: number
  totalAreas: number
  areasWithTests: number
}) {
  if (totalTests === 0 && totalAreas === 0) return 0
  const approvalRate = totalTests > 0 ? approvedTests / totalTests : 0
  const areaCoverage = totalAreas > 0 ? areasWithTests / totalAreas : approvalRate > 0 ? 1 : 0
  const bugHealth    = totalBugs > 0 ? 1 - openBugs / totalBugs : openBugs === 0 ? 1 : 0
  return Math.round(approvalRate * 40 + areaCoverage * 35 + bugHealth * 25)
}

function HealthGauge({ score }: { score: number }) {
  const r = 38
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - score / 100)
  const color  = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label  = score >= 75 ? 'Good'    : score >= 50 ? 'Fair'    : 'Needs work'

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative flex items-center justify-center">
        <svg width={96} height={96} viewBox="0 0 96 96">
          {/* Track */}
          <circle
            cx={48} cy={48} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={8}
          />
          {/* Progress arc */}
          <circle
            cx={48} cy={48} r={r}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 48 48)"
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease', filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-[22px] font-black tabular-nums leading-none" style={{ color }}>
            {score}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            /100
          </span>
        </div>
      </div>
      <span className="text-[12px] font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

// ── Insights (rule-based) ─────────────────────────────────────────────────────

type Insight = {
  type: 'warning' | 'info' | 'success'
  message: string
  href?: string
  cta?: string
}

function buildInsights({
  areasWithNoTests,
  criticalBugs,
  draftTests,
  totalAreas,
  totalTests,
  projectId,
  oldestCriticalAgeMonths,
}: {
  areasWithNoTests: number
  criticalBugs: number
  draftTests: number
  totalAreas: number
  totalTests: number
  projectId: string
  oldestCriticalAgeMonths: number | null
}): Insight[] {
  const insights: Insight[] = []

  if (criticalBugs > 0) {
    const ageStr = oldestCriticalAgeMonths !== null ? ` — oldest is ${oldestCriticalAgeMonths}mo old` : ''
    insights.push({
      type: 'warning',
      message: `${criticalBugs} critical bug${criticalBugs > 1 ? 's' : ''} still open${ageStr}`,
      href: `/project/${projectId}/bugs`,
      cta: 'View bugs',
    })
  }
  if (areasWithNoTests > 0) {
    insights.push({
      type: 'warning',
      message: `${areasWithNoTests} area${areasWithNoTests > 1 ? 's have' : ' has'} no test cases`,
      href: `/project/${projectId}/generate`,
      cta: 'Generate tests',
    })
  }
  if (draftTests > 3) {
    insights.push({
      type: 'info',
      message: `${draftTests} test cases in Draft — approve or archive`,
      href: `/project/${projectId}/tests`,
      cta: 'Review tests',
    })
  }
  if (totalAreas === 0 && totalTests > 0) {
    insights.push({
      type: 'info',
      message: 'No areas defined — organise tests by area to track coverage',
      href: `/project/${projectId}/areas`,
      cta: 'Create areas',
    })
  }
  if (insights.length === 0) {
    insights.push({ type: 'success', message: 'Everything looks great — project is well-maintained.' })
  }
  return insights.slice(0, 3)
}

const INSIGHT_STYLE: Record<string, { bg: string; border: string; color: string; dot: string }> = {
  warning: { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)', color: '#b45309', dot: '#f59e0b' },
  info:    { bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.2)', color: 'var(--text-secondary)', dot: '#3b82f6' },
  success: { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.2)', color: '#065f46', dot: '#10b981' },
}

// ── Activity helpers ──────────────────────────────────────────────────────────

const ACTION_LABEL: Record<string, (m: Record<string, unknown>) => string> = {
  'test_case.batch_created': (m) => `Saved ${m.count ?? ''} test case${Number(m.count) !== 1 ? 's' : ''}`,
  'bug.created':             (m) => `Reported bug: ${m.title ?? ''}`,
  'bug.status_changed':      (m) => `Bug status → ${m.to ?? ''}`,
  'ai.generated':            (m) => `Generated ${m.count ?? ''} test cases`,
  'suite.created':           (m) => `Created suite: ${m.name ?? ''}`,
}

function eventLabel(action: string, meta: Record<string, unknown>) {
  return ACTION_LABEL[action]?.(meta) ?? action.replace(/_/g, ' ').replace('.', ' — ')
}

const ACTION_COLOR: Record<string, string> = {
  'test_case.batch_created': '#10b981',
  'bug.created':             '#ef4444',
  'bug.status_changed':      '#f97316',
  'ai.generated':            '#8b5cf6',
  'suite.created':           '#3b82f6',
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ points, color = '#10b981' }: { points: number[]; color?: string }) {
  if (points.length < 2) {
    return <div className="flex-1" style={{ height: 40 }} />
  }
  const W = 120
  const H = 40
  const pad = 4
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (W - pad * 2))
  const ys = points.map((v) => H - pad - ((v - min) / range) * (H - pad * 2))
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ')
  const area = `${d} L ${xs[xs.length - 1].toFixed(1)} ${H} L ${xs[0].toFixed(1)} ${H} Z`
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={xs[xs.length - 1].toFixed(1)} cy={ys[ys.length - 1].toFixed(1)} r={3} fill={color} />
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      _count: { select: { testCases: true, bugReports: true, regressionSuites: true } },
    },
  })
  if (!project) notFound()

  const [
    totalTests,
    approvedTests,
    draftTests,
    openBugs,
    totalBugs,
    criticalBugs,
    areas,
    recentActivity,
    recentRuns,
    oldestCriticalBug,
  ] = await Promise.all([
    db.testCase.count({ where: { projectId: id, isArchived: false } }),
    db.testCase.count({ where: { projectId: id, isArchived: false, status: 'APPROVED' } }),
    db.testCase.count({ where: { projectId: id, isArchived: false, status: 'DRAFT' } }),
    db.bugReport.count({ where: { projectId: id, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    db.bugReport.count({ where: { projectId: id } }),
    db.bugReport.count({ where: { projectId: id, severity: 'CRITICAL', status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    db.area.findMany({
      where: { projectId: id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { testCases: true, bugReports: true } } },
      take: 6,
    }),
    db.activityEvent.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.suiteRun.findMany({
      where: { suite: { projectId: id }, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 7,
      include: {
        results: {
          where: { result: { not: 'NOT_RUN' } },
          select: { result: true },
        },
      },
    }),
    db.bugReport.findFirst({
      where: { projectId: id, severity: 'CRITICAL', status: { in: ['OPEN', 'IN_PROGRESS'] } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ])

  // Pass rate from suite runs
  const sparkPoints = [...recentRuns].reverse().map((run) => {
    const total  = run.results.length
    const passed = run.results.filter((r) => r.result === 'PASSED').length
    return total > 0 ? Math.round((passed / total) * 100) : 0
  })
  const passRate = sparkPoints.length > 0 ? sparkPoints[sparkPoints.length - 1] : null
  const passRateTrend = sparkPoints.length >= 2 ? sparkPoints[sparkPoints.length - 1] - sparkPoints[sparkPoints.length - 2] : null

  const areasWithTests    = areas.filter((a) => a._count.testCases > 0).length
  const areasWithNoTests  = areas.filter((a) => a._count.testCases === 0).length
  const healthScore       = computeHealthScore({ totalTests, approvedTests, openBugs, totalBugs, totalAreas: areas.length, areasWithTests })
  const coveragePct = areas.length > 0 ? Math.round((areasWithTests / areas.length) * 100) : (totalTests > 0 ? 100 : 0)
  const approvalPct = totalTests > 0 ? Math.round((approvedTests / totalTests) * 100) : 0
  const bugHealthPct = totalBugs > 0 ? Math.round(((totalBugs - openBugs) / totalBugs) * 100) : (openBugs === 0 ? 100 : 0)
  const oldestCriticalAgeMonths = oldestCriticalBug
    ? Math.round((Date.now() - new Date(oldestCriticalBug.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : null
  const insights          = buildInsights({ areasWithNoTests, criticalBugs, draftTests, totalAreas: areas.length, totalTests, projectId: id, oldestCriticalAgeMonths })

  const STATS = [
    {
      label: 'Test Cases',
      value: totalTests,
      icon: <FlaskConical className="h-4 w-4" />,
      iconColor: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      href: `/project/${id}/tests`,
    },
    {
      label: 'Approved',
      value: approvedTests,
      icon: <CheckCircle2 className="h-4 w-4" />,
      iconColor: approvedTests > 0 ? '#10b981' : '#94a3b8',
      bg: approvedTests > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.08)',
      href: `/project/${id}/tests`,
    },
    {
      label: 'Critical Bugs',
      value: criticalBugs,
      icon: <AlertTriangle className="h-4 w-4" />,
      iconColor: criticalBugs > 0 ? '#ef4444' : '#94a3b8',
      bg: criticalBugs > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.08)',
      href: `/project/${id}/bugs`,
    },
    {
      label: 'Open Bugs',
      value: openBugs,
      icon: <Bug className="h-4 w-4" />,
      iconColor: openBugs > 0 ? '#f97316' : '#94a3b8',
      bg: openBugs > 0 ? 'rgba(249,115,22,0.1)' : 'rgba(100,116,139,0.08)',
      href: `/project/${id}/bugs`,
    },
    {
      label: 'Suites',
      value: project._count.regressionSuites,
      icon: <Layers className="h-4 w-4" />,
      iconColor: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
      href: `/project/${id}/suites`,
    },
  ]

  return (
    <div className="animate-fade-up space-y-5">
      <ProjectOverviewActions projectId={id} />

      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm transition-colors group"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
        All Projects
      </Link>

      {/* ── Project hero card ── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div
          className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
          style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #3b82f6 60%, #93c5fd 100%)' }}
        />
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-black text-white select-none"
                style={{ background: 'linear-gradient(145deg, #1d4ed8 0%, #1e3a8a 100%)', boxShadow: '0 6px 20px rgba(29,78,216,0.35)' }}
              >
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
                  {project.name}
                </h1>
                {project.description ? (
                  <p className="text-sm mt-0.5 line-clamp-1 max-w-md" style={{ color: 'var(--text-secondary)' }}>
                    {project.description}
                  </p>
                ) : (
                  <Link
                    href={`/project/${id}/settings`}
                    className="text-sm mt-0.5 transition-colors hover:underline"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Add a description →
                  </Link>
                )}
              </div>
            </div>
            <ProjectQuickActions projectId={id} approvedTests={approvedTests} />
          </div>

          {/* Stats tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-5">
            {STATS.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-150 hover:shadow-md hover:opacity-90"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: s.bg, color: s.iconColor }}
                >
                  {s.icon}
                </div>
                <div>
                  <p className="text-lg font-bold tabular-nums leading-none" style={{ color: 'var(--text-primary)' }}>
                    {s.value}
                  </p>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Health score + Insights + Pass Rate row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Health gauge */}
        <div
          className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Health Score
          </p>
          <HealthGauge score={healthScore} />
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] max-w-[180px] text-center">
            <span style={{ color: 'var(--text-tertiary)' }}>Coverage <strong style={{ color: 'var(--text-secondary)' }}>{coveragePct}%</strong></span>
            <span style={{ color: 'var(--text-tertiary)' }}>Approved <strong style={{ color: 'var(--text-secondary)' }}>{approvalPct}%</strong></span>
            <span style={{ color: 'var(--text-tertiary)' }}>Bug health <strong style={{ color: 'var(--text-secondary)' }}>{bugHealthPct}%</strong></span>
          </div>
        </div>

        {/* Insights */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Insights
          </p>
          <div className="space-y-2">
            {insights.map((ins, i) => {
              const st = INSIGHT_STYLE[ins.type]
              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl"
                  style={{ background: st.bg, border: `1px solid ${st.border}` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: st.dot }} />
                    <p className="text-[13px] font-medium truncate" style={{ color: st.color }}>
                      {ins.message}
                    </p>
                  </div>
                  {ins.href && ins.cta && (
                    <Link
                      href={ins.href}
                      className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                      style={{ background: `${st.dot}18`, color: st.dot, border: `1px solid ${st.dot}30` }}
                    >
                      {ins.cta} →
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Pass Rate */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Pass Rate
          </p>
          {passRate !== null ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black tabular-nums leading-none" style={{ color: '#10b981' }}>
                  {passRate}%
                </span>
                {passRateTrend !== null && passRateTrend !== 0 && (
                  <span className="text-[12px] font-semibold" style={{ color: passRateTrend > 0 ? '#10b981' : '#ef4444' }}>
                    {passRateTrend > 0 ? '+' : ''}{passRateTrend}%
                  </span>
                )}
              </div>
              <p className="text-[11px] mt-1 mb-3" style={{ color: 'var(--text-tertiary)' }}>
                last 7 days vs prior
              </p>
              <div className="flex-1 flex items-end">
                <Sparkline points={sparkPoints} color="#10b981" />
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'var(--text-tertiary)' }}>
                {recentRuns.length} run{recentRuns.length !== 1 ? 's' : ''} · {passRate}% green
              </p>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
              <p className="text-[28px] font-black" style={{ color: 'var(--text-tertiary)' }}>—</p>
              <p className="text-[11px] text-center max-w-[110px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                Run a test suite to see pass rate
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom: Areas + Recent Activity side-by-side ── */}
      {(areas.length > 0 || recentActivity.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Areas */}
          {areas.length > 0 && (
            <div
              className="lg:col-span-3 rounded-2xl overflow-hidden"
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4" style={{ color: '#818cf8' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Areas</h2>
                  <span
                    className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-tertiary)' }}
                  >
                    {areas.length}
                  </span>
                </div>
                <Link
                  href={`/project/${id}/areas`}
                  className="text-[12px] font-semibold flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ color: '#818cf8' }}
                >
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {areas.map((area) => (
                  <Link
                    key={area.id}
                    href={`/project/${id}/area/${area.id}`}
                    className="group relative flex items-center overflow-hidden rounded-xl transition-all hover:shadow-md"
                    style={{ background: 'var(--surface-1)', border: `1px solid ${area.color}28`, minHeight: '56px' }}
                  >
                    <div className="absolute left-0 inset-y-0 w-[3px]" style={{ background: area.color }} />
                    <div className="pl-4 pr-3 py-2.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: area.color }} />
                        <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {area.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 mt-1">
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          <FlaskConical className="h-2.5 w-2.5 text-emerald-500" />
                          {area._count.testCases}
                        </span>
                        {area._count.bugReports > 0 && (
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: '#ef4444' }}>
                            <Bug className="h-2.5 w-2.5" />
                            {area._count.bugReports}
                          </span>
                        )}
                        {area._count.testCases === 0 && (
                          <span className="text-[10px] font-semibold" style={{ color: '#f59e0b' }}>No tests</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}

                <Link
                  href={`/project/${id}/areas`}
                  className="flex items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition-colors"
                  style={{ border: '1.5px dashed var(--border)', color: 'var(--text-tertiary)', minHeight: '56px' }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New area
                </Link>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div
              className={`${areas.length > 0 ? 'lg:col-span-2' : 'lg:col-span-5'} rounded-2xl overflow-hidden flex flex-col`}
              style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex items-center justify-between px-5 py-3.5 shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent activity</h2>
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <Link
                  href={`/project/${id}/activity`}
                  className="text-[12px] font-semibold flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="px-4 py-2 flex-1">
                {recentActivity.map((e, idx) => {
                  const meta = (() => { try { return JSON.parse(e.metadata ?? '{}') } catch { return {} } })() as Record<string, unknown>
                  const color = ACTION_COLOR[e.action] ?? '#94a3b8'
                  const name  = e.user.name || e.user.email.split('@')[0]
                  const isAI  = e.action.startsWith('ai.')
                  const initials = isAI
                    ? null
                    : name.split(' ').filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

                  return (
                    <div
                      key={e.id}
                      className="flex items-start gap-3 py-3"
                      style={{ borderBottom: idx < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold"
                        style={{ background: `${color}20`, color, border: `1.5px solid ${color}40` }}
                      >
                        {isAI ? <Sparkles className="h-3.5 w-3.5" /> : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {isAI ? 'AI' : name}
                          <span className="font-normal ml-1" style={{ color: 'var(--text-secondary)' }}>
                            {eventLabel(e.action, meta)}
                          </span>
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          {timeAgo(e.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Empty state: no tests, no areas, no activity ── */}
      {totalTests === 0 && areas.length === 0 && recentActivity.length === 0 && (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: 'var(--surface-0)', border: '2px dashed var(--border)' }}
        >
          <div
            className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <Sparkles className="h-7 w-7" style={{ color: '#60a5fa' }} />
          </div>
          <h3 className="font-bold text-[17px] mb-2" style={{ color: 'var(--text-primary)' }}>Start testing smarter</h3>
          <p className="text-sm max-w-xs mx-auto mb-7 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Generate AI test cases, define areas, or report your first bug — the sidebar has everything you need.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href={`/project/${id}/generate`}
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)', color: 'white', boxShadow: '0 4px 14px rgba(29,78,216,0.3)' }}
            >
              <Sparkles className="h-4 w-4" />
              Generate Tests
            </Link>
            <Link
              href={`/project/${id}/areas`}
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--surface-1)' }}
            >
              <Map className="h-4 w-4" />
              Create Areas
            </Link>
          </div>
        </div>
      )}

    </div>
  )
}
