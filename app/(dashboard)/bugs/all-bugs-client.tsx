'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, ExternalLink } from 'lucide-react'

interface Bug {
  id: string
  sequenceNum: number
  title: string
  severity: string
  status: string
  createdAt: string
  projectId: string
  projectName: string
}

interface Project { id: string; name: string }

const SEV_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CRITICAL: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)'  },
  HIGH:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  MEDIUM:   { label: 'Medium',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  LOW:      { label: 'Low',      color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OPEN:        { label: 'Open',        color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)',   border: 'rgba(59,130,246,0.25)'   },
  IN_PROGRESS: { label: 'In Progress', color: '#92400e', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.25)'   },
  RESOLVED:    { label: 'Resolved',    color: '#14532d', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.25)'    },
  CLOSED:      { label: 'Closed',      color: '#475569', bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.2)'   },
  WONT_FIX:    { label: "Won't Fix",   color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.15)'  },
}

const SEV_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AllBugsClient({ bugs, projects }: { bugs: Bug[]; projects: Project[] }) {
  const [search, setSearch]           = useState('')
  const [filterProject, setFP]        = useState('all')
  const [filterSeverity, setFS]       = useState('all')
  const [filterStatus, setFSt]        = useState('all')

  const filtered = useMemo(() => {
    return [...bugs]
      .sort((a, b) => (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9))
      .filter(b => {
        if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.projectName.toLowerCase().includes(search.toLowerCase())) return false
        if (filterProject !== 'all' && b.projectId !== filterProject) return false
        if (filterSeverity !== 'all' && b.severity !== filterSeverity) return false
        if (filterStatus !== 'all' && b.status !== filterStatus) return false
        return true
      })
  }, [bugs, search, filterProject, filterSeverity, filterStatus])

  if (bugs.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--surface-0)', border: '2px dashed var(--border)' }}>
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Search className="h-6 w-6" style={{ color: '#ef4444' }} />
        </div>
        <h3 className="font-bold text-[17px] mb-2" style={{ color: 'var(--text-primary)' }}>No bugs reported</h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Bugs filed from your projects will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search bugs…"
            style={{ width: '100%', height: 30, padding: '0 10px 0 28px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-0)', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
          />
        </div>

        {/* Project filter */}
        <select value={filterProject} onChange={e => setFP(e.target.value)}
          style={{ height: 30, padding: '0 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-0)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
          <option value="all">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Severity chips */}
        {(['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(s => (
          <button key={s} onClick={() => setFS(s)}
            className={`filter-chip${filterSeverity === s ? (s === 'CRITICAL' ? ' active-red' : s === 'HIGH' ? ' active-amber' : s === 'all' ? ' active' : ' active') : ''}`}
            style={{ height: 28 }}>
            {s === 'all' ? 'All severities' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFSt(e.target.value)}
          style={{ height: 30, padding: '0 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-0)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
          <option value="all">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
          {filtered.length} of {bugs.length}
        </span>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 100px 110px 100px 20px', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
        <div>Severity</div><div>Title</div><div>Project</div><div>Status</div><div>Reported</div><div />
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
          No bugs match the current filters.
        </div>
      ) : (
        <div>
          {filtered.map(b => {
            const sev = SEV_CONFIG[b.severity]
            const st  = STATUS_CONFIG[b.status]
            return (
              <Link key={b.id} href={`/project/${b.projectId}/bugs/${b.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '90px 1fr 100px 110px 100px 20px', gap: 10, padding: '10px 16px', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background .1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: sev?.bg, color: sev?.color, border: `1px solid ${sev?.border}`, whiteSpace: 'nowrap' }}>
                    <span style={{ width: 5, height: 5, borderRadius: 99, background: sev?.color }} />
                    {sev?.label}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.title}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>BUG-{b.sequenceNum}</div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.projectName}
                  </div>

                  <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: st?.bg, color: st?.color, border: `1px solid ${st?.border}`, whiteSpace: 'nowrap' }}>
                    {st?.label}
                  </span>

                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                    {timeAgo(b.createdAt)}
                  </div>

                  <ChevronRight size={13} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
