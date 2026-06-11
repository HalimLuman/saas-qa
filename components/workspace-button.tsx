'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, Check, Plus, Settings } from 'lucide-react'

interface WorkspaceButtonProps {
  name: string
  plan: string
  initial: string
}

const PLAN_COLORS: Record<string, string> = {
  FREE: '#6366f1',
  PRO:  '#3b82f6',
  TEAM: '#10b981',
}

export default function WorkspaceButton({ name, plan, initial }: WorkspaceButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const color = PLAN_COLORS[plan] ?? '#6366f1'

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', padding: '10px 10px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`sb-ws-btn${open ? ' ws-open' : ''}`}
      >
        {/* Workspace avatar */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 0 16px ${color}44`,
        }}>
          {initial}
        </div>

        {/* Name + plan */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {name}
            </span>
            <span
              data-plan={plan}
              className="sb-plan-badge"
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}
            >
              {plan}
            </span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--sb-ws-sub)', marginTop: 1 }}>
            Personal workspace
          </div>
        </div>

        <ChevronDown
          size={14}
          style={{
            color: 'var(--sb-ws-chevron)',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform .15s',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="sb-ws-dd">
          {/* Current workspace */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '7px 8px',
            borderRadius: 7,
            background: 'var(--sb-ws-dd-active-bg)',
          }}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: `linear-gradient(135deg, ${color}, ${color}99)`,
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sb-ws-dd-item-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--sb-ws-dd-item-sub)' }}>Personal · {plan}</div>
            </div>
            <Check size={13} style={{ color: 'var(--sb-ws-dd-check)', flexShrink: 0 }} />
          </div>

          <div style={{ height: 1, background: 'var(--sb-ws-dd-divider)', margin: '4px 0' }} />

          {/* Actions */}
          <Link
            href="/settings/billing"
            onClick={() => setOpen(false)}
            className="sb-ws-action"
          >
            <Settings size={13} />
            Workspace settings
          </Link>

          <button className="sb-ws-action">
            <Plus size={13} />
            New workspace
          </button>
        </div>
      )}
    </div>
  )
}
