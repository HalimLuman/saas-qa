import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Bug } from 'lucide-react'
import AllBugsClient from './all-bugs-client'

export default async function AllBugsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [bugs, projects] = await Promise.all([
    db.bugReport.findMany({
      where: { project: { userId } },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      include: { project: { select: { id: true, name: true } } },
    }),
    db.project.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const critical    = bugs.filter(b => b.severity === 'CRITICAL' && (b.status === 'OPEN' || b.status === 'IN_PROGRESS')).length
  const high        = bugs.filter(b => b.severity === 'HIGH'     && (b.status === 'OPEN' || b.status === 'IN_PROGRESS')).length
  const open        = bugs.filter(b => b.status === 'OPEN' || b.status === 'IN_PROGRESS').length
  const resolved    = bugs.filter(b => b.status === 'RESOLVED' || b.status === 'CLOSED').length

  const serialized = bugs.map(b => ({
    id: b.id,
    sequenceNum: b.sequenceNum,
    title: b.title,
    severity: b.severity,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    projectId: b.project.id,
    projectName: b.project.name,
  }))

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Page header */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f87171 60%, #fca5a5 100%)' }} />
        <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Bug className="h-5 w-5" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>All Bugs</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {bugs.length} total · {open} open · {resolved} resolved
              </p>
            </div>
          </div>
          {/* Severity summary */}
          {bugs.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: 'Critical', count: critical, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
                { label: 'High',     count: high,     color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' },
                { label: 'Open',     count: open,     color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
                { label: 'Resolved', count: resolved, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
              ].map(p => (
                <span key={p.label} className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg tabular-nums"
                  style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}>
                  {p.count} {p.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <AllBugsClient bugs={serialized} projects={projects} />
    </div>
  )
}
