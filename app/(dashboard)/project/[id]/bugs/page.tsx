import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import BugList from '@/components/bug-list'
import { timeAgo } from '@/lib/utils'

export default async function BugsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  })
  if (!project) notFound()

  const bugReports = await db.bugReport.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    include: { area: { select: { name: true, color: true } } },
  })

  const totalOpen    = bugReports.filter((b) => b.status === 'OPEN' || b.status === 'IN_PROGRESS').length
  const openCritical = bugReports.filter((b) => b.severity === 'CRITICAL' && (b.status === 'OPEN' || b.status === 'IN_PROGRESS')).length

  function oldestOf(sev: string) {
    const group = bugReports.filter((b) => b.severity === sev)
    if (!group.length) return null
    return group.reduce((a, b) => (a.createdAt < b.createdAt ? a : b))
  }

  const SEV_TILES = [
    { label: 'Critical', count: bugReports.filter((b) => b.severity === 'CRITICAL').length, color: '#dc2626', oldest: oldestOf('CRITICAL') },
    { label: 'High',     count: bugReports.filter((b) => b.severity === 'HIGH').length,     color: '#d97706', oldest: oldestOf('HIGH')     },
    { label: 'Medium',   count: bugReports.filter((b) => b.severity === 'MEDIUM').length,   color: '#3b82f6', oldest: oldestOf('MEDIUM')   },
    { label: 'Low',      count: bugReports.filter((b) => b.severity === 'LOW').length,      color: '#16a34a', oldest: oldestOf('LOW')      },
  ]

  return (
    <div className="animate-fade-up space-y-5">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 2 }}>
            {project.name}
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: 'var(--text-primary)' }}>
            Bug reports
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            {bugReports.length} bugs · {totalOpen} open
            {openCritical > 0 && ` · ${openCritical} critical need attention`}
          </p>
        </div>
        <Link
          href={`/project/${id}/bugs/new`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97]"
          style={{ background: 'var(--surface-0)', color: 'var(--text-primary)', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginTop: 4 }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Report bug
        </Link>
      </div>

      {/* Severity stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {SEV_TILES.map((s) => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: s.count > 0 ? s.color + '18' : 'var(--surface-2)',
              color: s.count > 0 ? s.color : 'var(--text-tertiary)',
              border: `1px solid ${s.count > 0 ? s.color + '40' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: s.count > 0 ? s.color : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {s.count}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>
                {s.oldest ? `Oldest ${timeAgo(s.oldest.createdAt)}` : 'No bugs'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bug list */}
      <BugList bugs={bugReports} projectId={id} />
    </div>
  )
}
