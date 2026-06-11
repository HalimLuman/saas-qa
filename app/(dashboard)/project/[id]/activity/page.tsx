import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'

const ACTION_CONFIG: Record<string, { label: (m: Record<string, unknown>) => string; color: string }> = {
  'test_case.batch_created': { label:(m) => `Saved ${m.count ?? ''} test case${Number(m.count) !== 1 ? 's' : ''}`, color:'#10b981' },
  'bug.created':             { label:(m) => `Reported bug: ${m.title ?? ''}`,              color:'#ef4444' },
  'bug.status_changed':      { label:(m) => `Bug status → ${m.to ?? ''}`,                  color:'#f97316' },
  'ai.generated':            { label:(m) => `Generated ${m.count ?? ''} test cases with AI`, color:'#8b5cf6' },
  'suite.created':           { label:(m) => `Created suite: ${m.name ?? ''}`,              color:'#3b82f6' },
  'suite.run_completed':     { label:(m) => `Suite run completed — ${m.passed ?? 0} passed, ${m.failed ?? 0} failed`, color:'#3b82f6' },
}

function getConfig(action: string) {
  return ACTION_CONFIG[action] ?? {
    label: () => action.replace(/_/g, ' ').replace('.', ' — '),
    color: '#94a3b8',
  }
}

function getIcon(action: string) {
  if (action.startsWith('bug')) return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
  if (action.startsWith('ai')) return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09z" />
    </svg>
  )
  if (action.startsWith('suite')) return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14M5 9h14M5 15h14M5 21h14" />
    </svg>
  )
  return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  )
}

function groupByDay(events: { createdAt: Date }[]) {
  const groups: { label: string; events: typeof events }[] = []
  const seen = new Map<string, typeof events>()
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86400000).toDateString()

  for (const e of events) {
    const d = new Date(e.createdAt).toDateString()
    const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(e.createdAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
    if (!seen.has(label)) { seen.set(label, []); groups.push({ label, events: seen.get(label)! }) }
    seen.get(label)!.push(e)
  }
  return groups
}

export default async function ActivityPage({
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

  const events = await db.activityEvent.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { name: true, email: true } } },
  })

  const parsed = events.map((e) => ({
    ...e,
    meta: (() => { try { return JSON.parse(e.metadata ?? '{}') } catch { return {} } })() as Record<string, unknown>,
  }))

  const groups = groupByDay(parsed)

  // Sidebar stats — count by action category
  const bugsFiled   = events.filter((e) => e.action === 'bug.created').length
  const aiCalls     = events.filter((e) => e.action === 'ai.generated').length
  const suiteRuns   = events.filter((e) => e.action === 'suite.run_completed').length
  const testsSaved  = events.filter((e) => e.action === 'test_case.batch_created').length

  // Top contributors by event count
  const contribMap = new Map<string, { name: string; count: number }>()
  for (const e of events) {
    const key = e.userId
    const name = e.user.name || e.user.email.split('@')[0]
    const prev = contribMap.get(key)
    contribMap.set(key, { name, count: (prev?.count ?? 0) + 1 })
  }
  const topContribs = [...contribMap.values()].sort((a, b) => b.count - a.count).slice(0, 4)

  const SIDEBAR_STATS = [
    { label:'Bugs filed',  value:bugsFiled,  color:'#ef4444' },
    { label:'AI calls',    value:aiCalls,    color:'#8b5cf6' },
    { label:'Suite runs',  value:suiteRuns,  color:'#3b82f6' },
    { label:'Tests saved', value:testsSaved, color:'#10b981' },
  ]

  return (
    <div className="animate-fade-up space-y-4">
      {/* Back link */}
      <Link
        href={`/project/${id}`}
        className="inline-flex items-center gap-1.5 text-sm group"
        style={{ color:'var(--text-tertiary)' }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-0.5 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {project.name}
      </Link>

      {/* Header */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ height:3, background:'linear-gradient(90deg,#6366f1,#818cf8,#a5b4fc)' }} />
        <div style={{ padding:'18px 22px' }}>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.025em', margin:0, color:'var(--text-primary)' }}>
            Activity
          </h1>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4 }}>
            Every meaningful event — bugs filed, tests saved, AI generations, runs completed.
            {events.length > 0 && <> · {events.length} events recorded</>}
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background:'var(--surface-0)', border:'2px dashed var(--border)' }}>
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-5" style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.2)' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#818cf8" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <h3 className="font-bold text-[17px] mb-2" style={{ color:'var(--text-primary)' }}>No activity yet</h3>
          <p className="text-sm max-w-xs mx-auto" style={{ color:'var(--text-secondary)' }}>
            Events will appear here as your team generates tests, reports bugs, and runs suites.
          </p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, alignItems:'start' }}>
          {/* Timeline */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {groups.map((day) => (
              <div key={day.label}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-tertiary)', whiteSpace:'nowrap' }}>
                    {day.label}
                  </span>
                  <span style={{ flex:1, height:1, background:'var(--border)' }} />
                  <span style={{ fontSize:11, color:'var(--text-tertiary)' }}>{day.events.length} events</span>
                </div>

                <div className="card" style={{ padding:14, position:'relative' }}>
                  <div style={{ position:'absolute', left:30, top:18, bottom:18, width:1, background:'var(--border)' }} />
                  {(day.events as typeof parsed).map((e, i) => {
                    const cfg = getConfig(e.action)
                    const displayName = e.user.name || e.user.email.split('@')[0]
                    return (
                      <div key={e.id} style={{ display:'flex', gap:14, padding:'10px 0' }}>
                        <div style={{
                          width:28, height:28, borderRadius:99,
                          background: cfg.color+'20', color: cfg.color,
                          border: `1.5px solid ${cfg.color}40`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          flexShrink:0, position:'relative', zIndex:1,
                        }}>
                          {getIcon(e.action)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, color:'var(--text-primary)', margin:0 }}>
                            <strong>{displayName}</strong>{' '}
                            <span style={{ color:'var(--text-secondary)', fontWeight:400 }}>{cfg.label(e.meta)}</span>
                          </p>
                          <p style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:2 }}>
                            {new Date(e.createdAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <aside style={{ display:'flex', flexDirection:'column', gap:14, position:'sticky', top:16 }}>
            {/* Stats */}
            <div className="card" style={{ padding:16 }}>
              <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', color:'var(--text-tertiary)', textTransform:'uppercase', marginBottom:10 }}>
                All time
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {SIDEBAR_STATS.map((s) => (
                  <div key={s.label} style={{ padding:'8px 10px', borderRadius:8, background:'var(--surface-1)', border:'1px solid var(--border-subtle)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ width:6, height:6, borderRadius:99, background:s.color, display:'inline-block' }} />
                      <span style={{ fontSize:11, color:'var(--text-secondary)' }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', marginTop:4, letterSpacing:'-0.03em', fontVariantNumeric:'tabular-nums' }}>
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top contributors */}
            {topContribs.length > 0 && (
              <div className="card" style={{ padding:16 }}>
                <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.08em', color:'var(--text-tertiary)', textTransform:'uppercase', marginBottom:10 }}>
                  Top contributors
                </div>
                {topContribs.map((p, i) => {
                  const colors = ['#3b82f6','#10b981','#6366f1','#f59e0b']
                  const c = colors[i % colors.length]
                  const initials = p.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div key={p.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderTop:'1px solid var(--border-subtle)' }}>
                      <div style={{
                        width:26, height:26, borderRadius:99, flexShrink:0,
                        background: `linear-gradient(135deg,${c},${c}aa)`,
                        color:'#fff', fontSize:9.5, fontWeight:700,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>{initials}</div>
                      <span style={{ flex:1, fontSize:12.5, color:'var(--text-primary)', fontWeight:500, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', fontVariantNumeric:'tabular-nums' }}>
                        {p.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
