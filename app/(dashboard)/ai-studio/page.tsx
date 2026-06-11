import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ExternalLink, FlaskConical, ArrowRight, Zap } from 'lucide-react'
import { PLAN_LIMITS } from '@/lib/limits'

const ACCENTS = ['#3b82f6', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const DAY_MS = 24 * 60 * 60 * 1000

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function AiStudioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [user, projects, recentSessions, totalSessions, aiByDay] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { plan: true, aiCallsToday: true },
    }),
    db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, _count: { select: { testCases: true } } },
    }),
    db.generationSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        projectId: true,
        inputText: true,
        inputMode: true,
        createdAt: true,
        savedCaseIds: true,
        project: { select: { id: true, name: true } },
      },
    }),
    db.generationSession.count({ where: { userId } }),
    // Daily counts last 30 days
    db.generationSession.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 30 * DAY_MS) } },
      select: { createdAt: true },
    }),
  ])

  const plan = (user?.plan ?? 'FREE') as keyof typeof PLAN_LIMITS
  const aiLimit = PLAN_LIMITS[plan]?.aiCredits ?? 5
  const aiUsedToday = user?.aiCallsToday ?? 0
  const pct = Math.min(100, Math.round((aiUsedToday / aiLimit) * 100))

  // Daily usage last 14 days
  const dailyCounts = Array.from({ length: 14 }, (_, i) => {
    const dayStart = new Date(Date.now() - (13 - i) * DAY_MS)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + DAY_MS)
    return {
      label: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: aiByDay.filter(s => s.createdAt >= dayStart && s.createdAt < dayEnd).length,
    }
  })
  const maxDay = Math.max(...dailyCounts.map(d => d.count), 1)

  // Per-project AI usage
  const perProject = projects.map((p, i) => ({
    ...p,
    accent: ACCENTS[i % ACCENTS.length],
    sessions: recentSessions.filter(s => s.projectId === p.id).length,
    totalAllTime: totalSessions, // we'd need a grouped query; using approximation
  }))

  const barColor = pct >= 90 ? 'linear-gradient(90deg, #ef4444, #dc2626)'
    : pct >= 70 ? 'linear-gradient(90deg, #f59e0b, #d97706)'
    : 'linear-gradient(90deg, #a78bfa, #7c3aed)'

  return (
    <div className="space-y-6 animate-fade-up">
      <style>{`.ai-session-row:hover { background: var(--surface-1); }`}</style>
      {/* Page header */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 50%, #3b82f6 100%)' }} />
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.1))', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Sparkles className="h-5 w-5" style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>AI Studio</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {totalSessions} total generations · {aiUsedToday}/{aiLimit} today
            </p>
          </div>
          {plan === 'FREE' && (
            <Link href="/settings/billing"
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff' }}>
              <Zap className="h-3.5 w-3.5" />
              Upgrade for more
            </Link>
          )}
        </div>
      </div>

      {/* Usage + chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14 }}>
        {/* Credits widget */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 12 }}>
            Today&apos;s usage
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{aiUsedToday}</span>
            <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>/ {aiLimit}</span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: 'rgba(99,120,200,0.1)', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${Math.max(pct, 2)}%`, background: barColor, borderRadius: 99, transition: 'width .5s' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{aiLimit - aiUsedToday} credit{aiLimit - aiUsedToday !== 1 ? 's' : ''} remaining</span>
            <span style={{ fontWeight: 700, color: pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#7c3aed' }}>{pct}%</span>
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>Plan</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(124,58,237,0.12)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)' }}>{plan}</span>
              {plan === 'FREE' && (
                <Link href="/settings/billing" style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Upgrade <ArrowRight size={12} />
                </Link>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              {aiLimit} generations/day · Resets daily at midnight
            </div>
          </div>
        </div>

        {/* Daily usage chart */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Generations · 14 days</span>
            <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              {dailyCounts.reduce((a, d) => a + d.count, 0)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 64 }}>
            {dailyCounts.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%',
                  height: Math.max(4, (d.count / maxDay) * 64),
                  borderRadius: 4,
                  background: d.count > 0 ? 'linear-gradient(180deg, #a78bfa, #7c3aed)' : 'rgba(99,120,200,0.12)',
                  animation: `qa-rise .5s ${i * 0.03}s ease-out both`,
                  transformOrigin: 'bottom',
                  transition: 'height .3s',
                }} />
                {i % 4 === 0 && <span style={{ fontSize: 9, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{d.label}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick generate — project cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Generate for a project</h2>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{projects.length}</span>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-10 rounded-2xl" style={{ background: 'var(--surface-0)', border: '2px dashed var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Create a project first to start generating tests.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {projects.map((p, i) => {
              const accent = ACCENTS[i % ACCENTS.length]
              return (
                <Link key={p.id} href={`/project/${p.id}/generate`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="card card-hover" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}66)` }} />
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${accent}20`, color: accent, border: `1px solid ${accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FlaskConical size={10} style={{ color: '#10b981' }} />
                            {p._count.testCases} test{p._count.testCases !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', flexShrink: 0 }}>
                          <Sparkles size={13} style={{ color: '#7c3aed' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>Generate tests</span>
                        <ArrowRight size={13} style={{ color: '#7c3aed' }} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent generation sessions */}
      {recentSessions.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} style={{ color: '#7c3aed' }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Recent sessions</h2>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{recentSessions.length}</span>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 80px', gap: 10, padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
            <div>Description</div><div>Project</div><div>Saved</div><div>When</div>
          </div>

          {recentSessions.map(s => {
            let savedCount = 0
            try { savedCount = (JSON.parse(s.savedCaseIds) as string[]).length } catch { /* ignore */ }
            const preview = s.inputText.length > 80 ? s.inputText.slice(0, 80) + '…' : s.inputText
            return (
              <Link key={s.id} href={`/project/${s.project.id}/generate/history?session=${s.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                  className="ai-session-row"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 80px', gap: 10, padding: '11px 20px', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background .1s' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {preview || '(no description)'}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>
                      {s.inputMode.replace(/_/g, ' ').toLowerCase()}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.project.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {savedCount > 0 ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FlaskConical size={11} style={{ color: '#10b981' }} />
                        {savedCount} saved
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>None saved</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{timeAgo(s.createdAt)}</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
