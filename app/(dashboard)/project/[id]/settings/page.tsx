import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import ProjectSettingsForm from '@/components/project-settings-form'
import IntegrationsSettings from '@/components/integrations-settings'
import WebhooksSettings from '@/components/webhooks-settings'

const TABS = [
  { id:'general',      label:'General',      icon:'settings' },
  { id:'integrations', label:'Integrations', icon:'zap' },
  { id:'webhooks',     label:'Webhooks',     icon:'pulse' },
  { id:'danger',       label:'Danger zone',  icon:'flame' },
] as const

type TabId = typeof TABS[number]['id']

function TabIcon({ icon }: { icon: string }) {
  if (icon === 'settings') return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 0 0 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
  if (icon === 'zap') return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
  if (icon === 'pulse') return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
  if (icon === 'flame') return (
    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 0 1 6.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0 1 20 13a7.975 7.975 0 0 1-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1 0 12.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  )
  return null
}

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const { tab: tabParam } = await searchParams
  const activeTab: TabId = (TABS.find((t) => t.id === tabParam)?.id ?? 'general') as TabId

  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true, description: true },
  })
  if (!project) notFound()

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

      {/* Header card */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ height:3, background:'linear-gradient(90deg,#64748b,#94a3b8,#cbd5e1)' }} />
        <div style={{ padding:'18px 22px' }}>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.025em', margin:0, color:'var(--text-primary)' }}>
            Project settings
          </h1>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4 }}>
            Tune defaults, manage integrations, configure webhooks.
          </p>
        </div>
      </div>

      {/* Tabs + content */}
      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:24, alignItems:'start' }}>
        {/* Vertical tab nav */}
        <nav style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {TABS.map((t) => {
            const active = t.id === activeTab
            const isDanger = t.id === 'danger'
            return (
              <Link
                key={t.id}
                href={`/project/${id}/settings?tab=${t.id}`}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'9px 12px', borderRadius:8,
                  fontSize:13, fontWeight: active ? 600 : 500,
                  background: active ? 'var(--surface-0)' : 'transparent',
                  color: active ? (isDanger ? '#dc2626' : 'var(--text-primary)') : (isDanger ? '#ef4444' : 'var(--text-secondary)'),
                  border: `1px solid ${active ? 'var(--border)' : 'transparent'}`,
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                  textDecoration:'none',
                  textTransform:'capitalize',
                }}
              >
                <span style={{ color: active ? (isDanger ? '#dc2626' : 'var(--text-secondary)') : 'var(--text-tertiary)' }}>
                  <TabIcon icon={t.icon} />
                </span>
                {t.label}
              </Link>
            )
          })}
        </nav>

        {/* Tab content */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {activeTab === 'general' && (
            <ProjectSettingsForm project={project} />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsSettings projectId={id} />
          )}

          {activeTab === 'webhooks' && (
            <WebhooksSettings projectId={id} />
          )}

          {activeTab === 'danger' && (
            <div className="card" style={{ padding:22, border:'1px solid rgba(239,68,68,0.3)' }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#dc2626', margin:'0 0 4px' }}>Danger zone</h3>
              <p style={{ fontSize:12.5, color:'var(--text-secondary)', margin:'0 0 18px' }}>
                Irreversible and destructive actions. Proceed with caution.
              </p>
              <div style={{ padding:16, borderRadius:10, background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', margin:'0 0 2px' }}>Delete project</p>
                    <p style={{ fontSize:12, color:'var(--text-secondary)', margin:0 }}>
                      Permanently delete this project and all associated test cases, bugs, and suites. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    style={{
                      height:32, padding:'0 14px', borderRadius:8, flexShrink:0,
                      fontSize:12, fontWeight:600,
                      background:'rgba(239,68,68,0.08)', color:'#dc2626',
                      border:'1px solid rgba(239,68,68,0.3)', cursor:'pointer',
                    }}
                  >
                    Delete project
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
