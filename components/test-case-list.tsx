'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Trash2, CheckCircle2, FlaskConical, Sparkles,
  Pencil, Search, X, Copy, Check, CheckSquare, ClipboardList, Bug,
  Upload, ChevronDown, ChevronUp, SlidersHorizontal, ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import TestCaseFormDialog, { type TestCaseData } from './test-case-form-dialog'

interface TestCase {
  id: string
  displayNum: number
  title: string
  module: string | null
  areaId: string | null
  areaName: string | null
  areaColor: string | null
  preconditions: string | null
  steps: string
  expectedResult: string
  priority: string
  category: string
  status: string
  updatedAt: string | Date
}

interface Area {
  id: string
  name: string
  color: string
}

interface Suite {
  id: string
  name: string
}

type ExecResult = 'PASS' | 'FAIL' | 'SKIP' | 'BLOCKED'
type SortKey = 'priority' | 'status' | 'updated'

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Draft', APPROVED: 'Approved', DEPRECATED: 'Deprecated' }
const STATUS_NEXT: Record<string, string> = { DRAFT: 'APPROVED', APPROVED: 'DEPRECATED', DEPRECATED: 'DRAFT' }

const STATUS_PILL: Record<string, { bg: string; color: string; border: string }> = {
  DRAFT:      { bg: 'rgba(100,116,139,0.1)', color: '#64748b', border: 'rgba(100,116,139,0.2)' },
  APPROVED:   { bg: 'rgba(34,197,94,0.1)',   color: '#16a34a', border: 'rgba(34,197,94,0.2)'   },
  DEPRECATED: { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626', border: 'rgba(239,68,68,0.2)'   },
}

const ACTION_COLOR: Record<string, string> = {
  'test_case.batch_created': '#10b981',
  'bug.created': '#ef4444',
  'ai.generated': '#8b5cf6',
}

function parseSteps(steps: string): string[] {
  try {
    const parsed = JSON.parse(steps)
    return Array.isArray(parsed) ? parsed : [steps]
  } catch { return [steps] }
}

function priorityVariant(p: string): 'p0' | 'p1' | 'p2' | 'p3' {
  return p.toLowerCase() as 'p0' | 'p1' | 'p2' | 'p3'
}

function relativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`
  return `${Math.floor(diff / 2592000)}mo ago`
}

const CATEGORIES = ['Functional', 'Security', 'Edge Case', 'Performance', 'Accessibility', 'Negative', 'Boundary']

export default function TestCaseList({
  testCases,
  projectId,
  areas = [],
  suites = [],
  ownerInitials = 'U',
  ownerName = 'Owner',
  execMode = false,
  onEndExec,
}: {
  testCases: TestCase[]
  projectId: string
  areas?: Area[]
  suites?: Suite[]
  ownerInitials?: string
  ownerName?: string
  execMode?: boolean
  onEndExec?: () => void
}) {
  const router = useRouter()

  // ── Filter state ──────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  // ── Expand / edit / delete state ──────────────────────────────
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<TestCaseData | null>(null)

  // ── Inline status update ──────────────────────────────────────
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({})

  // ── Copy ─────────────────────────────────────────────────────
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // ── Execution mode (controlled by parent) ─────────────────────
  const [execResults, setExecResults] = useState<Record<string, ExecResult>>({})
  const [execNotes, setExecNotes] = useState<Record<string, string>>({})
  const [showSummary, setShowSummary] = useState(false)

  // ── Bulk selection ────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // Keep a ref to filtered so the execMode effect can read it without re-running
  const filteredRef = useRef<typeof testCases>([])

  // ── Computed ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = testCases.filter((tc) => {
      if (search && !tc.title.toLowerCase().includes(search.toLowerCase()) &&
          !(tc.areaName ?? '').toLowerCase().includes(search.toLowerCase())) return false
      if (filterPriority !== 'all' && tc.priority !== filterPriority) return false
      const status = localStatuses[tc.id] ?? tc.status
      if (filterStatus !== 'all' && status !== filterStatus) return false
      if (filterCategory !== 'all' && !tc.category.toLowerCase().includes(filterCategory.toLowerCase())) return false
      return true
    })

    list = [...list].sort((a, b) => {
      if (sortKey === 'priority') {
        const pa = PRIORITY_ORDER[a.priority] ?? 9
        const pb = PRIORITY_ORDER[b.priority] ?? 9
        return pa !== pb ? pa - pb : a.displayNum - b.displayNum
      }
      if (sortKey === 'status') {
        const sa = localStatuses[a.id] ?? a.status
        const sb = localStatuses[b.id] ?? b.status
        return sa.localeCompare(sb)
      }
      // updated
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return list
  }, [testCases, search, filterPriority, filterStatus, filterCategory, sortKey, localStatuses])

  // Sync ref every render so exec-mode init gets the latest filtered list
  filteredRef.current = filtered

  // When parent turns exec mode on, expand all rows and reset session state
  useEffect(() => {
    if (execMode) {
      setExecResults({})
      setExecNotes({})
      setShowSummary(false)
      setExpanded(new Set(filteredRef.current.map((tc) => tc.id)))
    }
  }, [execMode])

  const execEvaluated = Object.keys(execResults).length
  const execPct = filtered.length > 0 ? Math.round((execEvaluated / filtered.length) * 100) : 0
  const execPassed  = Object.values(execResults).filter((r) => r === 'PASS').length
  const execFailed  = Object.values(execResults).filter((r) => r === 'FAIL').length
  const execSkipped = Object.values(execResults).filter((r) => r === 'SKIP').length
  const execBlocked = Object.values(execResults).filter((r) => r === 'BLOCKED').length

  // ── Actions ───────────────────────────────────────────────────
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function archive(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/tests/${id}`, { method: 'DELETE' })
      router.refresh()
      toast.success('Test case archived')
    } catch {
      toast.error('Could not archive test case')
    } finally {
      setDeleting(null)
    }
  }

  async function cycleStatus(tc: TestCase, e: React.MouseEvent) {
    e.stopPropagation()
    const current = localStatuses[tc.id] ?? tc.status
    const next = STATUS_NEXT[current] ?? 'DRAFT'
    setLocalStatuses((prev) => ({ ...prev, [tc.id]: next }))
    setUpdatingStatus(tc.id)
    try {
      await fetch(`/api/tests/${tc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
    } catch {
      setLocalStatuses((prev) => ({ ...prev, [tc.id]: current }))
      toast.error('Could not update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  function copyTest(tc: TestCase, e: React.MouseEvent) {
    e.stopPropagation()
    const steps = parseSteps(tc.steps)
    const md = [
      `## ${tc.title}`,
      '',
      `**Priority:** ${tc.priority} | **Category:** ${tc.category} | **Status:** ${STATUS_LABELS[tc.status] ?? tc.status}`,
      '',
      tc.preconditions ? `**Preconditions:**\n${tc.preconditions}\n` : '',
      '**Steps to Reproduce:**',
      ...steps.map((s, i) => `${i + 1}. ${s}`),
      '',
      `**Expected Result:**\n${tc.expectedResult}`,
    ].filter((l) => l !== undefined).join('\n')
    navigator.clipboard.writeText(md)
    setCopiedId(tc.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Copied to clipboard')
  }

  function openEdit(tc: TestCase, e: React.MouseEvent) {
    e.stopPropagation()
    setEditTarget({
      id: tc.id, title: tc.title, module: tc.module ?? '',
      preconditions: tc.preconditions ?? '', steps: parseSteps(tc.steps),
      expectedResult: tc.expectedResult,
      priority: tc.priority as TestCaseData['priority'],
      category: tc.category as TestCaseData['category'],
    })
  }

  function setExecResult(id: string, result: ExecResult) {
    setExecResults((prev) => {
      if (prev[id] === result) { const next = { ...prev }; delete next[id]; return next }
      return { ...prev, [id]: result }
    })
    if (result === 'FAIL' || result === 'BLOCKED') setExpanded((prev) => new Set(prev).add(id))
  }

  function copyExecSummary() {
    const failedTests  = filtered.filter((tc) => execResults[tc.id] === 'FAIL')
    const blockedTests = filtered.filter((tc) => execResults[tc.id] === 'BLOCKED')
    const date = new Date().toLocaleDateString()
    const lines = [
      `# Test Execution Summary — ${date}`,
      '',
      `**Results:** ✅ ${execPassed} passed · ❌ ${execFailed} failed · ⏭ ${execSkipped} skipped · 🚫 ${execBlocked} blocked`,
      `**Total:** ${filtered.length} tests evaluated`,
      '',
    ]
    if (failedTests.length > 0) {
      lines.push('## Failed Tests', '')
      for (const tc of failedTests) {
        const note = execNotes[tc.id]
        lines.push(`- **${tc.title}** [${tc.priority}]${note ? `\n  > ${note}` : ''}`)
      }
    }
    navigator.clipboard.writeText(lines.join('\n'))
    toast.success('Execution summary copied')
  }

  function endExecMode() { setShowSummary(true); onEndExec?.() }
  function dismissSummary() { setShowSummary(false); setExecResults({}); setExecNotes({}); setExpanded(new Set()) }

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  function toggleSelectAll() {
    const ids = filtered.map((tc) => tc.id)
    const allSel = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSel) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  async function bulkAction(action: string, extra?: Record<string, unknown>) {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tests/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected], action, ...extra }),
      })
      if (!res.ok) throw new Error()
      const { affected } = await res.json()
      toast.success(`Updated ${affected} test${affected !== 1 ? 's' : ''}`)
      setSelected(new Set())
      router.refresh()
    } catch {
      toast.error('Bulk action failed')
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`/api/projects/${projectId}/tests/import`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      toast.success(`Imported ${data.imported} test${data.imported !== 1 ? 's' : ''}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      if (csvInputRef.current) csvInputRef.current.value = ''
    }
  }

  // ── Empty state ───────────────────────────────────────────────
  if (testCases.length === 0) {
    return (
      <div
        className="text-center py-20 rounded-2xl"
        style={{ background: 'var(--surface-0)', border: '2px dashed var(--border)' }}
      >
        <div
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-5"
          style={{ background: 'linear-gradient(135deg, #64748b, #475569)', boxShadow: '0 12px 28px rgba(100,116,139,0.35)' }}
        >
          <FlaskConical className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-[17px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No test cases yet</h3>
        <p className="text-sm mb-7 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Paste a feature description and let AI generate your first test suite in seconds.
        </p>
        <Link href={`/project/${projectId}/generate`}>
          <Button className="gap-2"><Sparkles className="h-4 w-4" />Generate with AI</Button>
        </Link>
      </div>
    )
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every((tc) => selected.has(tc.id))

  return (
    <>
      {/* ── Execution Summary Panel ───────────────────────────── */}
      {showSummary && (
        <div className="exec-banner mb-4 animate-slide-down">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Execution Session Complete</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{filtered.length} tests evaluated</p>
            </div>
            <button onClick={dismissSummary} className="h-6 w-6 rounded-md flex items-center justify-center" style={{ color: 'var(--text-tertiary)', background: 'var(--surface-2)' }}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Passed',  count: execPassed,  color: '#16a34a', bg: 'rgba(34,197,94,0.1)' },
              { label: 'Failed',  count: execFailed,  color: '#dc2626', bg: 'rgba(239,68,68,0.1)' },
              { label: 'Skipped', count: execSkipped, color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
              { label: 'Blocked', count: execBlocked, color: '#d97706', bg: 'rgba(245,158,11,0.1)' },
            ].map(({ label, count, color, bg }) => (
              <div key={label} className="rounded-lg p-2.5 text-center" style={{ background: bg }}>
                <p className="text-lg font-bold tabular-nums" style={{ color }}>{count}</p>
                <p className="text-[11px] font-medium" style={{ color }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyExecSummary} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(100,116,139,0.1)', color: '#475569', border: '1px solid rgba(100,116,139,0.2)' }}>
              <ClipboardList className="h-3.5 w-3.5" />Copy Summary
            </button>
            {execFailed > 0 && (
              <Link href={`/project/${projectId}/bugs/new`}>
                <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Bug className="h-3.5 w-3.5" />Create Bug Report
                </button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Main table card ───────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>

        {/* ── Filter bar ── */}
        {execMode ? (
          <div className="exec-banner mx-4 my-3 rounded-xl">
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => { setExpanded(new Set()); onEndExec?.() }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                <X className="h-3.5 w-3.5" />Exit
              </button>
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="exec-progress-track flex-1">
                  <div className="exec-progress-fill" style={{ width: `${Math.max(execPct, 2)}%` }} />
                </div>
                <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: 'var(--text-secondary)' }}>
                  {execEvaluated}/{filtered.length}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-medium shrink-0">
                {execPassed  > 0 && <span style={{ color: '#16a34a' }}>✅ {execPassed}</span>}
                {execFailed  > 0 && <span style={{ color: '#dc2626' }}>❌ {execFailed}</span>}
                {execSkipped > 0 && <span style={{ color: '#64748b' }}>⏭ {execSkipped}</span>}
                {execBlocked > 0 && <span style={{ color: '#d97706' }}>🚫 {execBlocked}</span>}
              </div>
              <button onClick={endExecMode} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }}>
                <CheckSquare className="h-3.5 w-3.5" />Finish Run
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            {/* Top row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="flex items-center gap-2 h-8 px-3 rounded-lg min-w-[160px] flex-1 max-w-xs" style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title…"
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                  style={{ color: 'var(--text-primary)' }}
                />
                {search && <button onClick={() => setSearch('')}><X className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} /></button>}
              </div>

              {/* Priority chips */}
              <div className="flex items-center gap-1">
                {['all', 'P0', 'P1', 'P2', 'P3'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPriority(p)}
                    className={`filter-chip ${filterPriority === p ? (p === 'P0' ? 'active-red' : p === 'P1' ? 'active-amber' : 'active') : ''}`}
                  >
                    {p === 'all' ? 'All priority' : p}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px shrink-0" style={{ background: 'var(--border)' }} />

              {/* Status chips */}
              <div className="flex items-center gap-1">
                {[
                  { value: 'all',      label: 'All status' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'DRAFT',    label: 'Draft' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterStatus(value)}
                    className={`filter-chip ${filterStatus === value ? 'active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* More filters toggle */}
              <button
                onClick={() => setShowMoreFilters((v) => !v)}
                className="flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg transition-colors"
                style={{ color: showMoreFilters ? 'var(--brand-500)' : 'var(--text-tertiary)', background: showMoreFilters ? 'rgba(37,99,235,0.07)' : 'transparent', border: showMoreFilters ? '1px solid rgba(37,99,235,0.2)' : '1px solid transparent' }}
              >
                <SlidersHorizontal className="h-3 w-3" />
                More filters
              </button>

              {/* Sort */}
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>Sort:</span>
                {(['priority', 'status', 'updated'] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setSortKey(k)}
                    className="flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-md capitalize transition-colors"
                    style={{
                      color: sortKey === k ? 'var(--brand-500)' : 'var(--text-secondary)',
                      background: sortKey === k ? 'rgba(37,99,235,0.07)' : 'transparent',
                      fontWeight: sortKey === k ? 600 : 400,
                    }}
                  >
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </button>
                ))}
                <ArrowUpDown className="h-3 w-3 ml-0.5" style={{ color: 'var(--text-tertiary)' }} />
              </div>

            </div>

            {/* More filters row */}
            {showMoreFilters && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-7 text-xs w-[140px] border-zinc-200 dark:border-zinc-700">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* CSV import */}
                <label className="flex items-center gap-1 text-[11px] cursor-pointer px-2 py-1 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                  <Upload className="h-3 w-3" />Import CSV
                  <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
                </label>

                {(search || filterPriority !== 'all' || filterStatus !== 'all' || filterCategory !== 'all') && (
                  <button
                    onClick={() => { setSearch(''); setFilterPriority('all'); setFilterStatus('all'); setFilterCategory('all') }}
                    className="text-[12px] font-medium transition-colors"
                    style={{ color: '#64748b' }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.2)' }}>
                <span className="text-[12px] font-bold" style={{ color: '#475569' }}>{selected.size} selected</span>
                <div className="h-3 w-px" style={{ background: 'rgba(100,116,139,0.3)' }} />
                <Select onValueChange={(v) => bulkAction('set_priority', { priority: v })} disabled={bulkLoading}>
                  <SelectTrigger className="h-7 text-xs w-28 border-zinc-200 dark:border-zinc-900"><SelectValue placeholder="Set priority" /></SelectTrigger>
                  <SelectContent>{(['P0','P1','P2','P3'] as const).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                {areas.length > 0 && (
                  <Select onValueChange={(v) => bulkAction('set_area', { areaId: v === '__none__' ? null : v })} disabled={bulkLoading}>
                    <SelectTrigger className="h-7 text-xs w-32 border-zinc-200 dark:border-zinc-900"><SelectValue placeholder="Set area" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No area</SelectItem>
                      {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {suites.length > 0 && (
                  <Select onValueChange={(v) => bulkAction('add_to_suite', { suiteId: v })} disabled={bulkLoading}>
                    <SelectTrigger className="h-7 text-xs w-36 border-zinc-200 dark:border-zinc-900"><SelectValue placeholder="Add to suite" /></SelectTrigger>
                    <SelectContent>{suites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                )}
                <Select onValueChange={(v) => bulkAction('set_status', { status: v })} disabled={bulkLoading}>
                  <SelectTrigger className="h-7 text-xs w-28 border-zinc-200 dark:border-zinc-900"><SelectValue placeholder="Set status" /></SelectTrigger>
                  <SelectContent>{(['DRAFT','APPROVED','DEPRECATED'] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <button onClick={() => bulkAction('delete')} disabled={bulkLoading} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md ml-auto" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Trash2 className="h-3 w-3" />Archive selected
                </button>
                <button onClick={() => setSelected(new Set())} style={{ color: 'var(--text-tertiary)' }}><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        )}

        {/* ── Table header ── */}
        <div
          className="hidden sm:grid items-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider select-none"
          style={{
            gridTemplateColumns: '28px 56px 1fr 130px 64px 100px 32px 72px 20px',
            gap: '8px',
            color: 'var(--text-tertiary)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-1)',
          }}
        >
          <div>
            <button
              onClick={toggleSelectAll}
              className="h-4 w-4 rounded flex items-center justify-center"
              style={{ border: '1.5px solid var(--border)', background: allVisibleSelected ? '#64748b' : 'transparent', color: 'white' }}
            >
              {allVisibleSelected && <Check className="h-2.5 w-2.5" />}
            </button>
          </div>
          <div>ID</div>
          <div>Title</div>
          <div>Area</div>
          <div>Priority</div>
          <div>Status</div>
          <div>Owner</div>
          <div>Updated</div>
          <div />
        </div>

        {/* ── No results ── */}
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            <p className="font-medium mb-1">No tests match the filters</p>
            <button className="text-sm" style={{ color: '#64748b' }} onClick={() => { setSearch(''); setFilterPriority('all'); setFilterStatus('all'); setFilterCategory('all') }}>
              Clear filters
            </button>
          </div>
        )}

        {/* ── Rows ── */}
        <div>
          {filtered.map((tc, idx) => {
            const isExpanded = expanded.has(tc.id)
            const steps      = parseSteps(tc.steps)
            const execResult = execResults[tc.id]
            const tcStatus   = localStatuses[tc.id] ?? tc.status
            const statusStyle = STATUS_PILL[tcStatus] ?? STATUS_PILL.DRAFT
            const isSelected = selected.has(tc.id)

            let rowBg = ''
            if (execResult === 'PASS')    rowBg = 'rgba(34,197,94,0.04)'
            else if (execResult === 'FAIL')    rowBg = 'rgba(239,68,68,0.04)'
            else if (execResult === 'SKIP')    rowBg = 'rgba(100,116,139,0.04)'
            else if (execResult === 'BLOCKED') rowBg = 'rgba(245,158,11,0.04)'

            return (
              <div
                key={tc.id}
                style={{ borderBottom: idx < filtered.length - 1 || isExpanded ? '1px solid var(--border)' : 'none' }}
              >
                {/* ── Data row ── */}
                <div
                  className="grid items-center px-4 py-3 cursor-pointer transition-colors duration-100"
                  style={{
                    gridTemplateColumns: '28px 56px 1fr 130px 64px 100px 32px 72px 20px',
                    gap: '8px',
                    background: rowBg || (isSelected ? 'rgba(37,99,235,0.03)' : ''),
                  }}
                  onClick={() => toggleExpand(tc.id)}
                  onMouseEnter={(e) => { if (!rowBg && !isSelected) e.currentTarget.style.background = 'var(--surface-1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = rowBg || (isSelected ? 'rgba(37,99,235,0.03)' : '') }}
                >
                  {/* Checkbox */}
                  <button
                    className="h-4 w-4 rounded shrink-0 flex items-center justify-center transition-colors"
                    style={{ border: '1.5px solid var(--border)', background: isSelected ? '#64748b' : 'transparent', color: 'white' }}
                    onClick={(e) => toggleSelect(tc.id, e)}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </button>

                  {/* T-ID */}
                  <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                    T-{String(tc.displayNum).padStart(2, '0')}
                  </span>

                  {/* Title */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{tc.title}</p>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {steps.length} step{steps.length !== 1 ? 's' : ''} · {tc.category}
                    </p>
                  </div>

                  {/* Area */}
                  <div className="min-w-0">
                    {tc.areaName ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] px-2 py-0.5 rounded-full truncate max-w-full" style={{ background: `${tc.areaColor ?? '#8b5cf6'}15`, border: `1px solid ${tc.areaColor ?? '#8b5cf6'}30` }}>
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: tc.areaColor ?? '#8b5cf6' }} />
                        <span className="truncate font-medium" style={{ color: tc.areaColor ?? '#8b5cf6' }}>{tc.areaName}</span>
                      </span>
                    ) : (
                      <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>—</span>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <Badge variant={priorityVariant(tc.priority)}>{tc.priority}</Badge>
                  </div>

                  {/* Status */}
                  <button
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors"
                    style={statusStyle}
                    onClick={(e) => cycleStatus(tc, e)}
                    disabled={updatingStatus === tc.id}
                    title="Click to cycle status"
                  >
                    {tcStatus === 'APPROVED' && <CheckCircle2 className="h-2.5 w-2.5" />}
                    {STATUS_LABELS[tcStatus]}
                  </button>

                  {/* Owner */}
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #1e3a8a)' }}
                    title={ownerName}
                  >
                    {ownerInitials}
                  </div>

                  {/* Updated */}
                  <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    {relativeTime(tc.updatedAt)}
                  </span>

                  {/* Expand chevron */}
                  <div style={{ color: 'var(--text-tertiary)' }}>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </div>
                </div>

                {/* ── Exec buttons (always show in exec mode, above details) ── */}
                {execMode && (
                  <div className="px-10 pb-2 flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[11px] font-semibold mr-1" style={{ color: 'var(--text-tertiary)' }}>Result:</span>
                    <button className={`exec-btn btn-pass  ${execResult === 'PASS'    ? 'selected' : ''}`} onClick={() => setExecResult(tc.id, 'PASS')}>✓ Pass</button>
                    <button className={`exec-btn btn-fail  ${execResult === 'FAIL'    ? 'selected' : ''}`} onClick={() => setExecResult(tc.id, 'FAIL')}>✗ Fail</button>
                    <button className={`exec-btn btn-skip  ${execResult === 'SKIP'    ? 'selected' : ''}`} onClick={() => setExecResult(tc.id, 'SKIP')}>→ Skip</button>
                    <button className={`exec-btn btn-blocked ${execResult === 'BLOCKED' ? 'selected' : ''}`} onClick={() => setExecResult(tc.id, 'BLOCKED')}>⊘ Blocked</button>
                  </div>
                )}

                {/* ── Expanded details ── */}
                {isExpanded && (
                  <div className="px-10 pb-4 pt-2 space-y-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                    {tc.preconditions && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Preconditions</p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tc.preconditions}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-tertiary)' }}>Steps</p>
                      <ol className="space-y-1.5">
                        {steps.map((step, i) => (
                          <li key={i} className="flex gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <span className="font-bold shrink-0 tabular-nums" style={{ color: '#64748b' }}>{i + 1}.</span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Expected result</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tc.expectedResult}</p>
                    </div>

                    {/* Exec notes */}
                    <div style={{ display: execMode || execResult ? undefined : 'none' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Notes (optional)</p>
                      <textarea
                        value={execNotes[tc.id] ?? ''}
                        onChange={(e) => setExecNotes((prev) => ({ ...prev, [tc.id]: e.target.value }))}
                        placeholder="Add observations, bugs found, environment details…"
                        rows={2}
                        className="w-full text-sm rounded-lg px-3 py-2 resize-none outline-none"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Edit / Archive */}
                    {!execMode && (
                      <div className="flex items-center justify-between pt-1">
                        {/* Copy */}
                        <button
                          className="flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg transition-colors"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                          onClick={(e) => copyTest(tc, e)}
                        >
                          {copiedId === tc.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          {copiedId === tc.id ? 'Copied' : 'Copy markdown'}
                        </button>
                        <div className="flex gap-1.5">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={(e) => openEdit(tc, e)}>
                            <Pencil className="h-3 w-3" />Edit
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 text-xs gap-1.5"
                            onClick={(e) => { e.stopPropagation(); archive(tc.id) }}
                            disabled={deleting === tc.id}
                          >
                            <Trash2 className="h-3 w-3" />Archive
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Footer count ── */}
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-1)' }}>
            <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {filtered.length === testCases.length
                ? `${testCases.length} test case${testCases.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${testCases.length} test cases`}
            </span>
            {(search || filterPriority !== 'all' || filterStatus !== 'all' || filterCategory !== 'all') && (
              <button
                className="text-[12px] font-medium"
                style={{ color: '#64748b' }}
                onClick={() => { setSearch(''); setFilterPriority('all'); setFilterStatus('all'); setFilterCategory('all') }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {editTarget && (
        <TestCaseFormDialog
          open={editTarget !== null}
          onOpenChange={(v) => { if (!v) setEditTarget(null) }}
          mode="edit"
          projectId={projectId}
          initial={editTarget}
        />
      )}
    </>
  )
}
