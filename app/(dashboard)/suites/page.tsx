import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Layers, ChevronRight, Play, FlaskConical } from 'lucide-react'

const ACCENTS = ['#3b82f6', '#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function passColor(r: number | null) {
  if (r == null) return '#94a3b8'
  if (r >= 95) return '#22c55e'
  if (r >= 85) return '#3b82f6'
  if (r >= 70) return '#f59e0b'
  return '#ef4444'
}

export default async function SuitesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const projects = await db.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true },
  })

  const suites = await db.regressionSuite.findMany({
    where: { project: { userId } },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { testCases: true } },
      project: { select: { id: true, name: true } },
      runs: {
        where: { status: 'COMPLETED' },
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: {
          startedAt: true,
          results: { select: { result: true } },
        },
      },
    },
  })

  const totalSuites = suites.length
  const totalCases = suites.reduce((s, suite) => s + suite._count.testCases, 0)
  const suitesWithRuns = suites.filter(s => s.runs.length > 0).length

  function suitePassRate(suite: typeof suites[0]) {
    const run = suite.runs[0]
    if (!run) return null
    const rel = run.results.filter(r => r.result !== 'NOT_RUN')
    if (rel.length === 0) return null
    return Math.round(rel.filter(r => r.result === 'PASSED').length / rel.length * 100)
  }

  // Group suites by project
  const suitesByProject = new Map<string, typeof suites>()
  for (const suite of suites) {
    const pid = suite.project.id
    if (!suitesByProject.has(pid)) suitesByProject.set(pid, [])
    suitesByProject.get(pid)!.push(suite)
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Page header */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 60%, #8b5cf6 100%)' }} />
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Layers className="h-5 w-5" style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Suites</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {totalSuites} suite{totalSuites !== 1 ? 's' : ''} · {totalCases} test cases · {suitesWithRuns} with run history
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12px] font-semibold px-2.5 py-1 rounded-lg tabular-nums"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {totalSuites === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--surface-0)', border: '2px dashed var(--border)' }}>
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-5 mx-auto"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 12px 28px rgba(59,130,246,0.3)' }}>
            <Layers className="h-7 w-7 text-white" />
          </div>
          <h3 className="font-bold text-[17px] mb-2" style={{ color: 'var(--text-primary)' }}>No suites yet</h3>
          <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Create regression suites inside your projects to run them before every release.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(suitesByProject.entries()).map(([pid, projectSuites], pi) => {
            const project = projectSuites[0].project
            const accent = ACCENTS[projects.findIndex(p => p.id === pid) % ACCENTS.length]
            return (
              <div key={pid}>
                {/* Project section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}20`, color: accent, border: `1px solid ${accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                    {project.name.slice(0, 2).toUpperCase()}
                  </div>
                  <Link href={`/project/${pid}`} className="hover-underline" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
                    {project.name}
                  </Link>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{projectSuites.length} suite{projectSuites.length !== 1 ? 's' : ''}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <Link href={`/project/${pid}/suites/new`}
                    style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.07)' }}>
                    + New suite
                  </Link>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 70px 90px 80px 100px 20px', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
                    <div>Suite</div><div>Cases</div><div>Pass rate</div><div>Last run</div><div>Created</div><div />
                  </div>
                  {projectSuites.map(suite => {
                    const rate = suitePassRate(suite)
                    const lastRunAgo = suite.runs[0] ? timeAgo(suite.runs[0].startedAt) : null
                    return (
                      <Link key={suite.id} href={`/project/${pid}/suites/${suite.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                        <div
                          className="hover-row"
                          style={{ display: 'grid', gridTemplateColumns: '1.8fr 70px 90px 80px 100px 20px', gap: 10, padding: '11px 16px', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Layers size={13} style={{ color: '#3b82f6' }} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{suite.name}</div>
                                {suite.description && <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{suite.description}</div>}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                            <FlaskConical size={11} style={{ color: '#10b981' }} />
                            <span style={{ fontWeight: 600 }}>{suite._count.testCases}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {rate != null ? (
                              <>
                                <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(99,120,200,0.1)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${rate}%`, background: passColor(rate), borderRadius: 99 }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: passColor(rate), fontVariantNumeric: 'tabular-nums', width: 34, textAlign: 'right' }}>{rate}%</span>
                              </>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>No runs</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {lastRunAgo ? (
                              <>
                                <Play size={11} style={{ color: '#3b82f6', flexShrink: 0 }} />
                                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{lastRunAgo}</span>
                              </>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Never</span>
                            )}
                          </div>

                          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{timeAgo(suite.createdAt)}</div>

                          <ChevronRight size={13} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
