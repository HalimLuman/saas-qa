import Link from 'next/link'
import { FlaskConical, LayoutDashboard, Sparkles, Zap, Settings, BarChart2, Bug, Play, Layers } from 'lucide-react'
import SidebarSignOut from './sidebar-sign-out'
import SidebarNavLink from './sidebar-nav-link'
import ProjectSidebarSection from './project-sidebar-section'
import WorkspaceButton from './workspace-button'

interface SidebarProps {
  user: {
    name?: string | null
    email?: string | null
    plan: string
    aiCallsToday: number
  }
  projects: { id: string; name: string }[]
  openBugsCount?: number
}

const PLAN_LIMITS: Record<string, number> = { FREE: 5, PRO: 75, TEAM: 150 }

export default function AppSidebar({ user, projects, openBugsCount = 0 }: SidebarProps) {
  const limit = PLAN_LIMITS[user.plan] ?? 5
  const used  = Math.min(user.aiCallsToday, limit)
  const pct   = limit > 0 ? Math.round((used / limit) * 100) : 0

  const displayName = user.name || user.email?.split('@')[0] || 'User'
  const initials    = displayName.slice(0, 2).toUpperCase()
  const wsName      = user.name || user.email?.split('@')[0] || 'My Workspace'

  const barColor =
    pct >= 90 ? 'linear-gradient(90deg, #ef4444, #dc2626)' :
    pct >= 70 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                'linear-gradient(90deg, #3b82f6, #1d4ed8)'

  const creditsCountColor =
    pct >= 90 ? '#ef4444' :
    pct >= 70 ? '#d97706' :
                'var(--sb-credits-ok)'

  return (
    <aside
      className="w-[240px] shrink-0 h-full flex flex-col overflow-hidden relative"
      style={{
        background: 'var(--sb-bg)',
        borderRight: '1px solid var(--sb-border)',
      }}
    >
      {/* Top ambient glow — dark mode only */}
      <div
        className="sb-ambient-glow absolute inset-x-0 top-0 h-52 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(59,130,246,0.22) 0%, transparent 65%)' }}
        aria-hidden="true"
      />

      {/* ── Logo bar ── */}
      <div
        className="relative z-10 flex items-center h-14 px-4 shrink-0"
        style={{ borderBottom: '1px solid var(--sb-border)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 flex-1 min-w-0 group">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 0 20px rgba(59,130,246,0.45), 0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold tracking-tight leading-none" style={{ color: 'var(--sb-logo-title)' }}>softAssert</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: 'var(--sb-logo-sub)' }}>
              AI QA Toolkit
            </p>
          </div>
        </Link>
      </div>

      {/* ── Workspace switcher ── */}
      <div className="relative z-20 shrink-0">
        <WorkspaceButton name={wsName} plan={user.plan} initial={initials} />
      </div>

      {/* ── Navigation ── */}
      <nav className="relative z-10 flex-1 min-h-0 px-2.5 pb-3 overflow-y-auto sidebar-scroll space-y-0.5">
        <div className="pb-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--sb-section-label)' }}>
            Workspace
          </p>
          <SidebarNavLink href="/dashboard" exact icon={<LayoutDashboard className="h-[15px] w-[15px]" />}>
            Projects
          </SidebarNavLink>
          <SidebarNavLink href="/insights" icon={<BarChart2 className="h-[15px] w-[15px]" />}>
            Insights
          </SidebarNavLink>
          <SidebarNavLink href="/bugs" icon={<Bug className="h-[15px] w-[15px]" />} badge={openBugsCount > 0 ? openBugsCount : undefined} badgeTone="red">
            All Bugs
          </SidebarNavLink>
          <SidebarNavLink href="/runs" icon={<Play className="h-[15px] w-[15px]" />}>
            Test Runs
          </SidebarNavLink>
          <SidebarNavLink href="/suites" icon={<Layers className="h-[15px] w-[15px]" />}>
            Suites
          </SidebarNavLink>
          <SidebarNavLink href="/ai-studio" icon={<Sparkles className="h-[15px] w-[15px]" />} dot>
            AI Studio
          </SidebarNavLink>
        </div>

        {/* Project-contextual nav — shown when inside a /project/[id] route */}
        <ProjectSidebarSection projects={projects} />

        <div className="pt-3 pb-1 mt-1" style={{ borderTop: '1px solid var(--sb-divider)' }}>
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--sb-section-label)' }}>
            Account
          </p>
          <SidebarNavLink href="/settings/billing" icon={<Settings className="h-[15px] w-[15px]" />}>
            Settings &amp; Billing
          </SidebarNavLink>
        </div>
      </nav>

      {/* ── Footer ── */}
      <div
        className="relative z-10 p-3 space-y-2 shrink-0"
        style={{ borderTop: '1px solid var(--sb-border)' }}
      >
        {/* AI Credits widget */}
        <div
          className="rounded-xl p-3 space-y-2.5"
          style={{ background: 'var(--sb-widget-bg)', border: '1px solid var(--sb-widget-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'var(--sb-credits-label)' }}>
              <Sparkles className="h-3 w-3" style={{ color: 'var(--sb-credits-icon)' }} />
              AI credits today
            </span>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: creditsCountColor }}>
              {used}/{limit}
            </span>
          </div>

          <div className="space-y-1">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sb-credits-track)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  background: barColor,
                  boxShadow: pct < 70 ? '0 0 6px rgba(59,130,246,0.4)' : undefined,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              {user.plan === 'FREE' && pct >= 80 ? (
                <Link
                  href="/settings/billing"
                  className="flex items-center gap-1.5 text-[11px] font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--sb-credits-upgrade)' }}
                >
                  <Zap className="h-3 w-3" />
                  Upgrade to Pro
                </Link>
              ) : (
                <p className="text-[11px]" style={{ color: 'var(--sb-credits-remaining)' }}>
                  {limit - used} left today
                </p>
              )}
              <span className="text-[10px] tabular-nums" style={{ color: 'var(--sb-credits-pct)' }}>
                {pct}%
              </span>
            </div>
          </div>
        </div>

        {/* User card */}
        <div
          className="rounded-xl p-2.5 flex items-center gap-2.5"
          style={{ background: 'var(--sb-widget-bg)', border: '1px solid var(--sb-widget-border)' }}
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
              boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: 'var(--sb-user-name)' }}>{displayName}</p>
            <span
              data-plan={user.plan}
              className="sb-plan-badge text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5"
            >
              {user.plan}
            </span>
          </div>
          <SidebarSignOut />
        </div>
      </div>
    </aside>
  )
}
