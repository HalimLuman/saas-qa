'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export default function SidebarSignOut() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      title="Sign out"
      className="h-7 w-7 shrink-0 flex items-center justify-center rounded-lg transition-all duration-150"
      style={{ color: 'rgba(100,116,139,0.6)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
        e.currentTarget.style.color = '#f87171'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = ''
        e.currentTarget.style.color = 'rgba(100,116,139,0.6)'
      }}
    >
      <LogOut className="h-3.5 w-3.5" />
    </button>
  )
}
