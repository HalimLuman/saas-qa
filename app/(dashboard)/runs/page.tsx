import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Play, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react'

function passRate(results: { result: string }[]) {
  const rel = results.filter(r => r.result !== 'NOT_RUN')
  if (rel.length === 0) return null
  return Math.round(rel.filter(r => r.result === 'PASSED').length / rel.length * 100)
}

function passColor(r: number | null) {
  if (r == null) return '#94a3b8'
  if (r >= 95) return '#22c55e'
  if (r >= 85) return '#3b82f6'
  if (r >= 70) return '#f59e0b'
  return '#ef4444'
}

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function duration(start: Date, end: Date | null) {
  if (!end) return null
  const secs = Math.floor((end.getTime() - start.getTime()) / 1000)
  if (secs < 60) return `${secs}s`
  return `${Math.floor(secs / 60)}m ${secs % 60}s`
}

export default async function RunsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const runs = await db.suiteRun.findMany({
    where: { suite: { project: { userId } } },
    orderBy: { startedAt: 'desc' },
    take: 200,
    include: {
      results: { select: { result: true } },
      suite: {
        select: {
          id: true,
          name: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
  })

  const completed = runs.filter(r => r.status === 'COMPLETED').length
  const inProgress = runs.filter(r => r.status === 'IN_PROGRESS').length
  const passing = runs.filter(r => { const rate = passRate(r.results); return rate != null && rate >= 85 }).length

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Page header */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 60%, #6366f1 100%)' }} />
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Play className="h-5 w-5" style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Test Runs</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {runs.length} total · {completed} completed · {inProgress > 0 ? `${inProgress} in progress` : `${passing} passing`}
            </p>
          </div>
          {/* Summary pills */}
          <div className="ml-auto flex items-center gap-2">
            {[
              { label: 'Completed', count: completed, color: '#3b82f6',  bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)'  },
              { label: 'Passing',   count: passing,   color: '#22c55e',  bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'   },
              ...(inProgress > 0 ? [{ label: 'Running', count: inProgress, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' }] : []),
            ].map(p => (
              <span key={p.label} className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg tabular-nums"
                style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>
                {p.count} {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Runs table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {runs.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-5 mx-auto"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Play className="h-6 w-6" style={{ color: '#3b82f6' }} />
            </div>
            <h3 className="font-bold text-[17px] mb-2" style={{ color: 'var(--text-primary)' }}>No test runs yet</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Run a suite from any project to see results here.
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 90px 90px 80px 80px 20px', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
              <div>Suite</div><div>Project</div><div>Status</div><div>Pass rate</div><div>Cases</div><div>Started</div><div />
            </div>

            {runs.map(run => {
              const rate = passRate(run.results)
              const total = run.results.filter(r => r.result !== 'NOT_RUN').length
              const passed = run.results.filter(r => r.result === 'PASSED').length
              const failed = run.results.filter(r => r.result === 'FAILED').length
              const dur = duration(run.startedAt, run.completedAt)
              const StatusIcon = run.status === 'COMPLETED'
                ? (rate != null && rate >= 85 ? CheckCircle2 : XCircle)
                : Clock
              const statusColor = run.status === 'IN_PROGRESS' ? '#f59e0b'
                : (rate != null && rate >= 85 ? '#22c55e' : '#ef4444')

              return (
                <Link key={run.id} href={`/project/${run.suite.project.id}/suites/${run.suite.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div
                    className="hover-row"
                  style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 90px 90px 80px 80px 20px', gap: 10, padding: '11px 16px', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {run.suite.name}
                        {run.name && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 6 }}>· {run.name}</span>}
                      </div>
                      {dur && <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>{dur}</div>}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {run.suite.project.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <StatusIcon size={13} style={{ color: statusColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>
                        {run.status === 'IN_PROGRESS' ? 'Running' : run.status === 'ABORTED' ? 'Aborted' : 'Done'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(99,120,200,0.1)', overflow: 'hidden' }}>
                        {rate != null && (
                          <div style={{ height: '100%', width: `${rate}%`, background: passColor(rate), borderRadius: 99 }} />
                        )}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: passColor(rate), fontVariantNumeric: 'tabular-nums', width: 32, textAlign: 'right' }}>
                        {rate != null ? `${rate}%` : '—'}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                      {total > 0 ? (
                        <span>
                          <span style={{ color: '#22c55e', fontWeight: 600 }}>{passed}</span>
                          <span style={{ color: 'var(--text-tertiary)' }}>/</span>
                          {failed > 0 && <><span style={{ color: '#ef4444', fontWeight: 600 }}>{failed}</span><span style={{ color: 'var(--text-tertiary)' }}> fail</span></>}
                          <span style={{ color: 'var(--text-tertiary)' }}> {total}</span>
                        </span>
                      ) : '—'}
                    </div>

                    <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                      {timeAgo(run.startedAt)}
                    </div>

                    <ChevronRight size={13} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </Link>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
