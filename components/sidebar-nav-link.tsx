'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SidebarNavLinkProps {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
  exact?: boolean
  badge?: number | string
  badgeTone?: string
  dot?: boolean
}

export default function SidebarNavLink({ href, icon, children, exact, badge }: SidebarNavLinkProps) {
  const pathname = usePathname()
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 relative',
        isActive
          ? 'text-slate-900 dark:text-white'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
      )}
      style={
        isActive
          ? { background: 'var(--sb-nav-active-bg)', border: 'var(--sb-nav-active-border)' }
          : undefined
      }
    >
      {/* Active left-border indicator */}
      {isActive && (
        <span
          className="absolute left-0 inset-y-1.5 w-0.5 rounded-full"
          style={{ background: 'var(--sb-nav-indicator)', boxShadow: 'var(--sb-nav-indicator-shadow)' }}
        />
      )}

      {/* Icon container */}
      <span
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-md shrink-0 transition-all duration-150',
          isActive
            ? 'text-blue-600 dark:text-blue-300'
            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
        )}
        style={{ background: isActive ? 'var(--sb-icon-active-bg)' : 'var(--sb-icon-inactive-bg)' }}
      >
        {icon}
      </span>

      <span className="flex-1 truncate">{children}</span>

      {badge !== undefined && badge !== 0 && (
        <span
          className="text-[10px] font-bold h-4 min-w-[16px] inline-flex items-center justify-center px-1 rounded-full tabular-nums shrink-0"
          style={{
            background: isActive ? 'var(--sb-badge-active-bg)' : 'var(--sb-badge-inactive-bg)',
            color: isActive ? 'var(--sb-badge-active-text)' : 'var(--sb-badge-inactive-text)',
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
