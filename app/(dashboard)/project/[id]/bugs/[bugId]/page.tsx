import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import CopyBugButton from '@/components/copy-bug-button'
import PushBugButton from '@/components/push-bug-button'
import MarkResolvedButton from '@/components/mark-resolved-button'
import EditBugButton from '@/components/edit-bug-button'

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH:     '#d97706',
  MEDIUM:   '#3b82f6',
  LOW:      '#16a34a',
}

const STATUS_MAP: Record<string, { bg: string; border: string; color: string; label: string }> = {
  OPEN:        { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  color: '#2563eb', label: 'Open'        },
  IN_PROGRESS: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  color: '#d97706', label: 'In Progress' },
  RESOLVED:    { bg: 'rgba(22,163,74,0.1)',   border: 'rgba(22,163,74,0.3)',   color: '#16a34a', label: 'Resolved'    },
  CLOSED:      { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', color: '#64748b', label: 'Closed'      },
  WONT_FIX:    { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', color: '#64748b', label: "Won't Fix"   },
}

export default async function BugDetailPage({
  params,
}: {
  params: Promise<{ id: string; bugId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id, bugId } = await params

  const bug = await db.bugReport.findFirst({
    where: { id: bugId, project: { id, userId: session.user.id } },
    include: {
      area:    { select: { name: true, color: true } },
      project: { select: { name: true } },
    },
  })

  if (!bug) notFound()

  let steps: string[] = []
  try { steps = JSON.parse(bug.stepsToReproduce) } catch { steps = bug.stepsToReproduce ? [bug.stepsToReproduce] : [] }

  const sevColor    = SEV_COLOR[bug.severity] ?? '#94a3b8'
  const statusStyle = STATUS_MAP[bug.status]  ?? STATUS_MAP.OPEN
  const bugNum      = `BUG-${String(bug.sequenceNum).padStart(3, '0')}`

  const PROPERTIES = [
    { label: 'Severity', node: (
      <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:sevColor+'18', color:sevColor, border:`1px solid ${sevColor}40`, letterSpacing:'0.03em' }}>
        {bug.severity}
      </span>
    )},
    { label: 'Status', node: (
      <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:statusStyle.bg, color:statusStyle.color, border:`1px solid ${statusStyle.border}` }}>
        {statusStyle.label}
      </span>
    )},
    ...(bug.area ? [{ label: 'Area', node: (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-primary)' }}>
        <span style={{ width:7, height:7, borderRadius:99, background:bug.area.color, display:'inline-block', flexShrink:0 }} />
        {bug.area.name}
      </span>
    )}] : []),
    ...(bug.environment ? [{ label: 'Env', node: (
      <span style={{ fontSize:12, color:'var(--text-primary)' }}>{bug.environment}</span>
    )}] : []),
    { label: 'Created',  node: <span style={{ fontSize:12, color:'var(--text-primary)' }}>{timeAgo(bug.createdAt)}</span> },
    { label: 'Updated',  node: <span style={{ fontSize:12, color:'var(--text-primary)' }}>{timeAgo(bug.updatedAt)}</span>  },
  ] as { label: string; node: React.ReactNode }[]

  return (
    <div className="animate-fade-up">

      {/* ── Top: breadcrumb + actions ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <nav style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5 }}>
          <Link href={`/project/${id}`} className="hover:text-[var(--text-secondary)] transition-colors" style={{ color:'var(--text-tertiary)' }}>
            {bug.project.name}
          </Link>
          <ChevronRight className="h-3 w-3" style={{ color:'var(--text-tertiary)', opacity:0.5 }} />
          <Link href={`/project/${id}/bugs`} className="hover:text-[var(--text-secondary)] transition-colors" style={{ color:'var(--text-tertiary)' }}>
            Bugs
          </Link>
          <ChevronRight className="h-3 w-3" style={{ color:'var(--text-tertiary)', opacity:0.5 }} />
          <span style={{ color:'var(--text-primary)', fontWeight:600, fontFamily:'var(--font-mono)', fontSize:12 }}>{bugNum}</span>
        </nav>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <EditBugButton
            projectId={id}
            bug={{
              id:               bug.id,
              title:            bug.title,
              description:      bug.description,
              severity:         bug.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
              steps,
              expectedBehavior: bug.expectedBehavior ?? '',
              actualBehavior:   bug.actualBehavior   ?? '',
              areaId:           bug.areaId           ?? null,
            }}
          />
          <PushBugButton projectId={id} bugId={bugId} settingsUrl={`/project/${id}/settings?tab=integrations`} />
          <MarkResolvedButton projectId={id} bugId={bugId} currentStatus={bug.status} />
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, alignItems:'start' }}>

        {/* ── Main column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Header card */}
          <div className="card" style={{ padding:20, borderLeft:`4px solid ${sevColor}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', fontWeight:600 }}>
                {bugNum}
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:sevColor+'18', color:sevColor, border:`1px solid ${sevColor}40` }}>
                {bug.severity.toLowerCase()}
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:statusStyle.bg, color:statusStyle.color, border:`1px solid ${statusStyle.border}` }}>
                {statusStyle.label}
              </span>
              <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-tertiary)' }}>
                Reported {timeAgo(bug.createdAt)}
              </span>
            </div>

            <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em', margin:0, color:'var(--text-primary)' }}>
              {bug.title}
            </h1>
            {bug.description && (
              <p style={{ fontSize:13.5, color:'var(--text-secondary)', marginTop:10, lineHeight:1.55 }}>
                {bug.description}
              </p>
            )}
          </div>

          {/* Steps + Expected/Actual */}
          {(steps.length > 0 || bug.expectedBehavior || bug.actualBehavior) && (
            <div className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <h2 style={{ display:'flex', alignItems:'center', gap:6, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-tertiary)', margin:0 }}>
                  {/* play triangle */}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M2 1.5l6 3.5-6 3.5V1.5z" />
                  </svg>
                  Steps to reproduce
                </h2>
                <CopyBugButton bug={{
                  sequenceNum:     bug.sequenceNum,
                  title:           bug.title,
                  description:     bug.description,
                  severity:        bug.severity,
                  status:          bug.status,
                  steps,
                  expectedBehavior: bug.expectedBehavior,
                  actualBehavior:   bug.actualBehavior,
                }} />
              </div>

              {steps.length > 0 && (
                <ol style={{ margin:0, paddingLeft:0, listStyle:'none' }}>
                  {steps.map((step, i) => (
                    <li key={i} style={{ display:'flex', gap:12, padding:'8px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
                      <span style={{
                        width:22, height:22, borderRadius:99, flexShrink:0,
                        background:'var(--surface-2)', color:'var(--text-secondary)',
                        fontSize:11, fontWeight:700,
                        display:'inline-flex', alignItems:'center', justifyContent:'center',
                      }}>{i + 1}</span>
                      <span style={{ fontSize:13, color:'var(--text-primary)', flex:1, paddingTop:2 }}>{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {(bug.expectedBehavior || bug.actualBehavior) && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop: steps.length > 0 ? 14 : 0 }}>
                  {bug.expectedBehavior && (
                    <div style={{ padding:12, borderRadius:10, background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.25)' }}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#16a34a', marginBottom:4 }}>Expected</div>
                      <div style={{ fontSize:12.5, color:'var(--text-primary)', lineHeight:1.5 }}>{bug.expectedBehavior}</div>
                    </div>
                  )}
                  {bug.actualBehavior && (
                    <div style={{ padding:12, borderRadius:10, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)' }}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#dc2626', marginBottom:4 }}>Actual</div>
                      <div style={{ fontSize:12.5, color:'var(--text-primary)', lineHeight:1.5 }}>{bug.actualBehavior}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recording placeholder */}
          {bug.sourceRecordingId && (
            <div className="card" style={{ padding:20 }}>
              <h2 style={{ display:'flex', alignItems:'center', gap:6, fontSize:10.5, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-tertiary)', margin:'0 0 14px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                </svg>
                Recording
              </h2>
              <div style={{
                height:120, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                background:'var(--surface-2)', border:'1px solid var(--border)',
                color:'var(--text-tertiary)', fontSize:12,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                </svg>
                Session replay
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Properties */}
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', color:'var(--text-tertiary)', textTransform:'uppercase', marginBottom:10 }}>
              Properties
            </div>
            {PROPERTIES.map((p) => (
              <div key={p.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', fontSize:12, borderTop:'1px solid var(--border-subtle)' }}>
                <span style={{ color:'var(--text-tertiary)' }}>{p.label}</span>
                {p.node}
              </div>
            ))}
          </div>

          {/* Linked */}
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', color:'var(--text-tertiary)', textTransform:'uppercase', marginBottom:10 }}>
              Linked
            </div>
            <p style={{ fontSize:12, color:'var(--text-tertiary)', margin:0 }}>No linked items yet.</p>
          </div>

          {/* AI Suggestion */}
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', color:'var(--text-tertiary)', textTransform:'uppercase', marginBottom:10 }}>
              AI Suggestion
            </div>
            <div style={{ padding:12, borderRadius:10, background:'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.05))', border:'1px solid rgba(59,130,246,0.2)' }}>
              <p style={{ fontSize:11.5, fontWeight:600, color:'var(--text-primary)', margin:'0 0 4px' }}>
                Add regression coverage
              </p>
              <p style={{ fontSize:11.5, color:'var(--text-secondary)', lineHeight:1.55, margin:'0 0 10px' }}>
                Generate test cases that catch this bug scenario and prevent recurrence.
              </p>
              <Link
                href={`/project/${id}/generate`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-all"
                style={{ background:'linear-gradient(135deg,#1d4ed8,#1e3a8a)', color:'#fff', fontSize:12, boxShadow:'0 4px 14px rgba(29,78,216,0.25)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate now
              </Link>
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}
