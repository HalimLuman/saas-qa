'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bug, Plus, Search, X, ChevronDown, ChevronRight } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { toast } from 'sonner'

interface BugReport {
  id: string
  sequenceNum: number
  title: string
  description: string
  severity: string
  status: string
  environment?: string | null
  createdAt: Date
  projectId: string
  area?: { name: string; color: string } | null
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH:     '#d97706',
  MEDIUM:   '#3b82f6',
  LOW:      '#16a34a',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  OPEN:        { label: 'Open',        bg: 'rgba(59,130,246,0.1)',   color: '#1d4ed8', border: 'rgba(59,130,246,0.25)'  },
  IN_PROGRESS: { label: 'In Progress', bg: 'rgba(245,158,11,0.1)',   color: '#92400e', border: 'rgba(245,158,11,0.25)'  },
  RESOLVED:    { label: 'Resolved',    bg: 'rgba(34,197,94,0.1)',    color: '#14532d', border: 'rgba(34,197,94,0.25)'   },
  CLOSED:      { label: 'Closed',      bg: 'rgba(100,116,139,0.1)',  color: '#475569', border: 'rgba(100,116,139,0.2)'  },
  WONT_FIX:    { label: "Won't Fix",   bg: 'rgba(100,116,139,0.08)', color: '#64748b', border: 'rgba(100,116,139,0.15)' },
}

const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN:        ['IN_PROGRESS', 'RESOLVED', 'WONT_FIX'],
  IN_PROGRESS: ['RESOLVED', 'OPEN', 'WONT_FIX'],
  RESOLVED:    ['CLOSED', 'OPEN'],
  CLOSED:      ['OPEN'],
  WONT_FIX:    ['OPEN'],
}

function formatEnv(env: string | null | undefined): string | null {
  if (!env) return null
  try {
    const parsed = JSON.parse(env)
    return Object.values(parsed as Record<string, string>).join(' · ')
  } catch {
    return env
  }
}

// grid columns: ID | TITLE | SEVERITY | STATUS | AREA | AGE | arrow
const COLS = '90px 1fr 88px 110px 110px 64px 20px'

export default function BugList({ bugs, projectId }: { bugs: BugReport[]; projectId: string }) {
  const router = useRouter()

  const [search,         setSearch]         = useState('')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus,   setFilterStatus]   = useState('all')
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [localStatuses,  setLocalStatuses]  = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    return [...bugs]
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))
      .filter((bug) => {
        if (search && !bug.title.toLowerCase().includes(search.toLowerCase())) return false
        if (filterSeverity !== 'all' && bug.severity !== filterSeverity) return false
        const status = localStatuses[bug.id] ?? bug.status
        if (filterStatus !== 'all' && status !== filterStatus) return false
        return true
      })
  }, [bugs, search, filterSeverity, filterStatus, localStatuses])

  async function changeStatus(bugId: string, newStatus: string) {
    const prev = localStatuses[bugId] ?? bugs.find((b) => b.id === bugId)?.status ?? 'OPEN'
    setLocalStatuses((s) => ({ ...s, [bugId]: newStatus }))
    setStatusDropdown(null)
    setUpdatingStatus(bugId)
    try {
      const res = await fetch(`/api/projects/${projectId}/bugs/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`)
      router.refresh()
    } catch {
      setLocalStatuses((s) => ({ ...s, [bugId]: prev }))
      toast.error('Could not update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  if (bugs.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--surface-0)', border: '2px dashed var(--border)' }}>
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-5" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 12px 28px rgba(239,68,68,0.3)' }}>
          <Bug className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-[17px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No bug reports yet</h3>
        <p className="text-sm mb-7 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Found an issue? Log it here — AI will suggest a severity level based on your description.
        </p>
        <Link href={`/project/${projectId}/bugs/new`}>
          <button className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <Plus className="h-4 w-4" />
            Report a Bug
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: '1 1 200px', minWidth: 180, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', width: 14, height: 14, pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bug title..."
            style={{
              width: '100%', height: 36, paddingLeft: 32, paddingRight: search ? 32 : 12,
              borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface-0)', color: 'var(--text-primary)',
              fontSize: 13, outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
              <X style={{ width: 13, height: 13, color: 'var(--text-tertiary)' }} />
            </button>
          )}
        </div>

        {/* Severity chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {(['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((s) => {
            const active = filterSeverity === s
            const c = s !== 'all' ? SEV_COLOR[s] : undefined
            return (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? (c ? c + '15' : 'var(--surface-2)') : 'transparent',
                  color: active ? (c ?? 'var(--text-primary)') : 'var(--text-tertiary)',
                  border: `1px solid ${active ? (c ? c + '45' : 'var(--border)') : 'transparent'}`,
                }}
              >
                {s === 'all' ? 'All severity' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            )
          })}
        </div>

        {/* Status chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {(['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((s) => {
            const active = filterStatus === s
            const cfg = STATUS_CONFIG[s]
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? (cfg?.bg ?? 'var(--surface-2)') : 'transparent',
                  color: active ? (cfg?.color ?? 'var(--text-primary)') : 'var(--text-tertiary)',
                  border: `1px solid ${active ? (cfg?.border ?? 'var(--border)') : 'transparent'}`,
                }}
              >
                {s === 'all' ? 'All status' : cfg?.label ?? s}
              </button>
            )
          })}
        </div>

        {(search || filterSeverity !== 'all' || filterStatus !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterSeverity('all'); setFilterStatus('all') }}
            style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginLeft: 4 }}>
            Clear · {filtered.length}/{bugs.length}
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: COLS, gap: 8,
          padding: '8px 16px 8px 20px',
          background: 'var(--surface-1)',
          borderBottom: '1px solid var(--border)',
        }}>
          {['ID', 'TITLE', 'SEVERITY', 'STATUS', 'AREA', 'AGE', ''].map((h) => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            No bugs match the filters.{' '}
            <button onClick={() => { setSearch(''); setFilterSeverity('all'); setFilterStatus('all') }} style={{ color: '#3b82f6', fontWeight: 600 }}>
              Clear filters
            </button>
          </div>
        ) : (
          filtered.map((bug, idx) => {
            const status      = localStatuses[bug.id] ?? bug.status
            const s           = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN
            const sevColor    = SEV_COLOR[bug.severity] ?? '#94a3b8'
            const isUpdating  = updatingStatus === bug.id
            const dropOpen    = statusDropdown === bug.id
            const nextStatuses = STATUS_TRANSITIONS[status] ?? []
            const envLabel    = formatEnv(bug.environment)

            return (
              <div
                key={bug.id}
                onClick={() => router.push(`/project/${projectId}/bugs/${bug.id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: COLS, gap: 8,
                  padding: '11px 16px 11px 16px',
                  borderTop: idx === 0 ? 'none' : '1px solid var(--border-subtle)',
                  borderLeft: `3px solid ${sevColor}`,
                  background: 'var(--surface-0)',
                  cursor: 'pointer',
                  alignItems: 'center',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-0)')}
              >
                {/* ID */}
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  BUG-{String(bug.sequenceNum).padStart(3, '0')}
                </span>

                {/* Title */}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                    {bug.title}
                  </p>
                  {envLabel && (
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{envLabel}</p>
                  )}
                </div>

                {/* Severity */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 8px', borderRadius: 99, width: 'fit-content',
                  fontSize: 11, fontWeight: 600,
                  background: sevColor + '18', color: sevColor, border: `1px solid ${sevColor}40`,
                }}>
                  {bug.severity.toLowerCase()}
                </span>

                {/* Status — dropdown */}
                <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    disabled={isUpdating}
                    onClick={(e) => { e.stopPropagation(); setStatusDropdown(dropOpen ? null : bug.id) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 99,
                      fontSize: 11, fontWeight: 600,
                      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                    <ChevronDown style={{ width: 10, height: 10 }} />
                  </button>

                  {dropOpen && (
                    <div style={{
                      position: 'absolute', zIndex: 50, top: 'calc(100% + 4px)', left: 0,
                      borderRadius: 10, minWidth: 140, overflow: 'hidden',
                      background: 'var(--surface-0)', border: '1px solid var(--border)',
                      boxShadow: '0 8px 24px -4px rgba(0,0,0,0.15)',
                    }}>
                      {nextStatuses.map((ns) => {
                        const nc = STATUS_CONFIG[ns]
                        return (
                          <button key={ns}
                            onClick={(e) => { e.stopPropagation(); changeStatus(bug.id, ns) }}
                            style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 12, fontWeight: 500, color: nc?.color ?? 'var(--text-primary)', cursor: 'pointer' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                          >
                            {nc?.label ?? ns}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Area */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden' }}>
                  {bug.area && (
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: bug.area.color, flexShrink: 0, display: 'inline-block' }} />
                  )}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bug.area?.name ?? <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </span>
                </span>

                {/* Age */}
                <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  {timeAgo(bug.createdAt)}
                </span>

                {/* Arrow */}
                <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-tertiary)', opacity: 0.5 }} />
              </div>
            )
          })
        )}
      </div>

      {/* Click-outside overlay for dropdown */}
      {statusDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setStatusDropdown(null)} />
      )}
    </div>
  )
}
