'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { FlaskConical, LogOut } from 'lucide-react'

interface NavProps {
  user: { name?: string | null; email?: string | null }
}

export default function DashboardNav({ user }: NavProps) {
  const pathname = usePathname()

  return (
    <header
      className="shrink-0 h-14 flex items-center"
      style={{ background: 'var(--surface-0)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="w-full px-4 max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          <FlaskConical className="h-5 w-5" style={{ color: 'var(--brand-500)' }} />
          softAssert
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-md transition-colors"
            style={{
              background: pathname === '/dashboard' ? 'var(--surface-2)' : 'transparent',
              color: pathname === '/dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: pathname === '/dashboard' ? '500' : '400',
            }}
          >
            Projects
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <span className="text-sm hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
            {user.name || user.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign out"
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
