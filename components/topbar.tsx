'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Search, Moon, Sun, FlaskConical } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { useEffect, useState } from 'react'
import { useTopbarActions } from '@/components/topbar-actions-provider'

type Crumb = { label: string; href: string }

function buildCrumbs(
  pathname: string,
  projects?: { id: string; name: string }[],
  workspaceName?: string,
): Crumb[] {
  const segs = pathname.split('/').filter(Boolean)
  const base: Crumb[] = workspaceName
    ? [{ label: workspaceName, href: '/dashboard' }, { label: 'Projects', href: '/dashboard' }]
    : [{ label: 'Projects', href: '/dashboard' }]

  if (!segs.length || segs[0] === 'dashboard') return base

  if (segs[0] === 'onboarding') return [{ label: 'Getting Started', href: '/onboarding' }]

  if (segs[0] === 'settings') {
    const settingsBase: Crumb[] = [{ label: 'Settings', href: '/settings/billing' }]
    if (segs[1] === 'billing') settingsBase.push({ label: 'Billing & Plan', href: '/settings/billing' })
    return settingsBase
  }

  if (segs[0] === 'project' && segs[1]) {
    const pid = segs[1]
    const projectName = projects?.find((p) => p.id === pid)?.name ?? 'Project'
    base.push({ label: projectName, href: `/project/${pid}` })

    if (segs[2] === 'tests') {
      base.push({ label: 'Tests', href: '#' })
    } else if (segs[2] === 'generate') {
      if (segs[3] === 'history') base.push({ label: 'History', href: '#' })
      else base.push({ label: 'AI Generate', href: '#' })
    } else if (segs[2] === 'bugs') {
      if (segs[3] === 'new') base.push({ label: 'Report Bug', href: '#' })
      else if (segs[3]) base.push({ label: 'Bug Detail', href: '#' })
      else base.push({ label: 'Bugs', href: '#' })
    } else if (segs[2] === 'suites') {
      if (segs[3] === 'new') base.push({ label: 'New Suite', href: '#' })
      else if (segs[3]) {
        const sid = segs[3]
        if (segs[4] === 'run' && segs[5]) {
          base.push({ label: 'Suite', href: `/project/${pid}/suites/${sid}` })
          base.push({ label: 'Run', href: '#' })
        } else {
          base.push({ label: 'Suite', href: '#' })
        }
      } else {
        base.push({ label: 'Suites', href: '#' })
      }
    } else if (segs[2] === 'areas') {
      base.push({ label: 'Areas', href: '#' })
    } else if (segs[2] === 'area' && segs[3]) {
      base.push({ label: 'Area', href: '#' })
    } else if (segs[2] === 'activity') {
      base.push({ label: 'Activity', href: '#' })
    } else if (segs[2] === 'settings') {
      base.push({ label: 'Settings', href: '#' })
    } else if (segs[2] === 'api-tests') {
      base.push({ label: 'API Tests', href: '#' })
    }
  }

  return base
}

interface TopbarProps {
  userInitials: string
  userName: string
  workspaceName?: string
  projects?: { id: string; name: string }[]
}

export default function Topbar({ userInitials, userName, workspaceName, projects }: TopbarProps) {
  const pathname = usePathname()
  const crumbs = buildCrumbs(pathname, projects, workspaceName)
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { actions } = useTopbarActions()
  useEffect(() => setMounted(true), [])

  function openSearch() {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true })
    )
  }

  return (
    <header className="topbar-glass h-14 flex items-center gap-4 px-6 shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5 min-w-0 shrink-0">
            {i > 0 && (
              <ChevronRight
                className="h-3 w-3 shrink-0"
                style={{ color: 'var(--text-tertiary)' }}
              />
            )}
            {i === 0 && (
              <FlaskConical
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: 'var(--brand-500)' }}
              />
            )}
            {i < crumbs.length - 1 ? (
              <Link
                href={c.href}
                className="text-sm transition-colors hover:underline underline-offset-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {c.label}
              </Link>
            ) : (
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Page-specific actions injected by individual pages */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button className="topbar-search" onClick={openSearch} title="Search (Ctrl+K)">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Search anything…</span>
          <kbd
            className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded font-mono leading-none"
            style={{
              background: 'var(--surface-3)',
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border)',
            }}
          >
            ⌘K
          </kbd>
        </button>

        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
            title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} />
            ) : (
              <Moon className="h-3.5 w-3.5" style={{ color: '#64748b' }} />
            )}
          </button>
        )}

        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 select-none"
          style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)' }}
          title={userName}
        >
          {userInitials}
        </div>
      </div>
    </header>
  )
}
