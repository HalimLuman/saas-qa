'use client'

import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function SearchTrigger() {
  const [mac, setMac] = useState(false)
  useEffect(() => { setMac(/Mac/.test(navigator.platform)) }, [])

  function open() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }))
  }

  return (
    <button
      onClick={open}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-2 transition-all duration-150 group"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(148,163,184,0.6)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        e.currentTarget.style.color = 'rgba(203,213,225,0.8)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.color = 'rgba(148,163,184,0.6)'
      }}
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 text-left text-[12px]">Search…</span>
      <kbd
        className="text-[10px] px-1.5 py-0.5 rounded-md font-mono leading-none"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(148,163,184,0.45)',
        }}
      >
        {mac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  )
}
