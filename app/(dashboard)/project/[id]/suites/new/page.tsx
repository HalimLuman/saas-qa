'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, GripVertical, Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useTopbarActions } from '@/components/topbar-actions-provider'

interface TestCase {
  id: string
  title: string
  module: string | null
  areaId: string | null
  priority: string
  category: string
  status: string
  steps: string
  createdAt: string
}

interface Area {
  id: string
  name: string
  color: string
}

type Cadence = 'EVERY_PR' | 'NIGHTLY' | 'WEEKLY' | 'MANUAL'

const CADENCE_OPTIONS: { value: Cadence; label: string; sub: string }[] = [
  { value: 'EVERY_PR', label: 'Every PR', sub: '2-min target' },
  { value: 'NIGHTLY', label: 'Nightly', sub: '20:00 UTC' },
  { value: 'WEEKLY', label: 'Weekly', sub: 'Mon 09:00' },
  { value: 'MANUAL', label: 'Manual', sub: 'Run on demand' },
]

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }

function countSteps(steps: string): number {
  try {
    const parsed = JSON.parse(steps)
    if (Array.isArray(parsed)) return parsed.length
  } catch { }
  return steps.split('\n').filter((l) => l.trim()).length || 1
}

function estimateSeconds(steps: string): number {
  return countSteps(steps) * 11
}

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#ef4444',
  P1: '#f97316',
  P2: '#3b82f6',
  P3: '#8b5cf6',
}

export default function NewSuitePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { setActions } = useTopbarActions()

  const [projectName, setProjectName] = useState('')
  const [suiteName, setSuiteName] = useState('')
  const [description, setDescription] = useState('')
  const [cadence, setCadence] = useState<Cadence>('EVERY_PR')
  const [ownerName, setOwnerName] = useState('')
  const [failThreshold, setFailThreshold] = useState(95)

  const [allTests, setAllTests] = useState<TestCase[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [suiteTests, setSuiteTests] = useState<TestCase[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [areaFilter, setAreaFilter] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)

  // drag state
  const dragIndex = useRef<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)

  // refs so topbar action handlers always read latest state
  const latestState = useRef({
    suiteName, description, cadence, ownerName, failThreshold, suiteTests, id,
  })
  useEffect(() => {
    latestState.current = { suiteName, description, cadence, ownerName, failThreshold, suiteTests, id }
  })

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.project?.name) setProjectName(d.project.name) })
    fetch(`/api/projects/${id}/tests`)
      .then((r) => r.json())
      .then((d) => setAllTests(d.testCases || []))
    fetch(`/api/projects/${id}/areas`)
      .then((r) => r.ok ? r.json() : { areas: [] })
      .then((d) => setAreas(d.areas ?? []))
  }, [id])

  const isReady = suiteName.trim().length > 0 && suiteTests.length > 0

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <Link href={`/project/${id}/suites`}>
          <Button variant="outline" size="sm">Cancel</Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          disabled={saving || !suiteName.trim()}
          onClick={handleSaveDraft}
        >
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
        <button
          disabled={submitting || !isReady}
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: isReady
              ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
              : 'var(--surface-3)',
            color: isReady ? 'white' : 'var(--text-tertiary)',
            boxShadow: isReady ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
          }}
        >
          {submitting ? 'Creating…' : 'Create suite'}
        </button>
      </div>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suiteName, suiteTests.length, submitting, saving, isReady, id])

  useEffect(() => {
    return () => setActions(null)
  }, [setActions])

  const availableTests = allTests.filter((tc) => {
    if (suiteTests.some((s) => s.id === tc.id)) return false
    if (searchQuery && !tc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (areaFilter && tc.areaId !== areaFilter) return false
    if (priorityFilter && tc.priority !== priorityFilter) return false
    return true
  })

  const uniqueAreaIds = Array.from(new Set(allTests.map((tc) => tc.areaId).filter(Boolean)))
  const visibleAreas = areas.filter((a) => uniqueAreaIds.includes(a.id))

  function addTest(tc: TestCase) {
    setSuiteTests((prev) => [...prev, tc])
  }

  function removeTest(tcId: string) {
    setSuiteTests((prev) => prev.filter((t) => t.id !== tcId))
  }

  // drag and drop reorder
  function onDragStart(index: number) {
    dragIndex.current = index
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    dragOverIndex.current = index
  }

  function onDrop() {
    const from = dragIndex.current
    const to = dragOverIndex.current
    if (from === null || to === null || from === to) return
    setSuiteTests((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    dragIndex.current = null
    dragOverIndex.current = null
  }

  async function handleCreate() {
    const s = latestState.current
    if (!s.suiteName.trim() || s.suiteTests.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/projects/${s.id}/suites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: s.suiteName.trim(),
          description: s.description.trim() || undefined,
          testCaseIds: s.suiteTests.map((t) => t.id),
          cadence: s.cadence,
          ownerName: s.ownerName.trim() || undefined,
          failThreshold: s.failThreshold,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Suite created with ${s.suiteTests.length} test cases`)
      router.push(`/project/${s.id}/suites/${data.suite.id}`)
    } catch (err: unknown) {
      toast.error('Error', { description: String(err) })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSaveDraft() {
    const s = latestState.current
    if (!s.suiteName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${s.id}/suites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: s.suiteName.trim(),
          description: s.description.trim() || undefined,
          testCaseIds: s.suiteTests.map((t) => t.id),
          cadence: s.cadence,
          ownerName: s.ownerName.trim() || undefined,
          failThreshold: s.failThreshold,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Draft saved')
      router.push(`/project/${s.id}/suites/${data.suite.id}`)
    } catch (err: unknown) {
      toast.error('Error', { description: String(err) })
    } finally {
      setSaving(false)
    }
  }

  // metrics
  const totalSecs = suiteTests.reduce((sum, tc) => sum + estimateSeconds(tc.steps), 0)
  const p0Count = suiteTests.filter((tc) => tc.priority === 'P0').length
  const totalLibraryTests = allTests.length
  const suitePct = totalLibraryTests > 0 ? Math.round((suiteTests.length / totalLibraryTests) * 100) : 0

  // T-number: index in allTests by createdAt asc
  const sortedAllById = [...allTests].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  function tNum(tc: TestCase): string {
    const idx = sortedAllById.findIndex((t) => t.id === tc.id)
    return `T-${idx + 1}`
  }

  const areaMap: Record<string, Area> = {}
  areas.forEach((a) => { areaMap[a.id] = a })

  const cadenceLabel = CADENCE_OPTIONS.find((c) => c.value === cadence)?.label ?? 'Manual'

  // donut SVG
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (circumference * suitePct) / 100

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Page header */}
      <div>
        <p
          className="text-[11px] font-bold uppercase tracking-widest mb-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {projectName ? `${projectName} · Suites` : 'Suites'}
        </p>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          New regression suite
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Pick test cases, choose a cadence, set ownership. Cases stay linked — edit the canonical
          test and every suite that uses it updates.
        </p>
      </div>

      {/* Metadata card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
          {/* Suite Name */}
          <div className='space-y-1.5 col-span-2'>
            <div className="space-y-1.5 col-span-1">
              <label
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Suite Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <Input
                value={suiteName}
                onChange={(e) => setSuiteName(e.target.value)}
                placeholder="e.g. Smoke · Coupons & AMEX"
                className="font-medium"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this suite cover?"
                className="resize-none text-sm"
                rows={2}
              />
            </div>
          </div>
          <div className='col-span-1'>
            {/* Cadence */}
            <div className="space-y-1.5 col-span-1">
              <label
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Cadence <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {CADENCE_OPTIONS.map((opt) => {
                  const active = cadence === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setCadence(opt.value)}
                      className="flex flex-col items-start px-3 py-1.5 rounded-lg text-left transition-all"
                      style={{
                        border: active ? '1.5px solid #2563eb' : '1.5px solid var(--border)',
                        background: active ? 'rgba(37,99,235,0.07)' : 'var(--surface-2)',
                        minWidth: 80,
                      }}
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{ color: active ? '#2563eb' : 'var(--text-primary)' }}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                        {opt.sub}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>



            {/* Owner */}
            <div className="space-y-1.5">
              <label
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Owner
              </label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Assignee name"
                className="w-36"
              />
            </div>

            {/* Fail threshold */}
            <div className="space-y-1.5">
              <label
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Fail Threshold
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>Mark FAILING below</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={failThreshold}
                  onChange={(e) => setFailThreshold(Number(e.target.value))}
                  className="w-12 text-center font-bold rounded border-0 bg-transparent focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test picker + sidebar */}
      <div className="flex gap-4" style={{ alignItems: 'flex-start' }}>
        {/* Available Tests */}
        <div
          className="flex-1 rounded-2xl overflow-hidden"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface-1)',
            minWidth: 0,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Available Tests
            </span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
            >
              {availableTests.length}
            </span>
          </div>

          {/* Search */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: 'var(--text-tertiary)' }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title…"
                className="w-full text-sm pl-8 pr-3 py-1.5 rounded-lg focus:outline-none"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Filter pills */}
          <div className="px-4 pb-3 flex flex-wrap gap-1.5">
            {/* Area pills */}
            <button
              onClick={() => setAreaFilter(null)}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all"
              style={{
                border: `1px solid ${areaFilter === null ? '#2563eb' : 'var(--border)'}`,
                background: areaFilter === null ? 'rgba(37,99,235,0.1)' : 'var(--surface-2)',
                color: areaFilter === null ? '#2563eb' : 'var(--text-secondary)',
              }}
            >
              All areas
            </button>
            {visibleAreas.map((area) => (
              <button
                key={area.id}
                onClick={() => setAreaFilter(areaFilter === area.id ? null : area.id)}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all flex items-center gap-1"
                style={{
                  border: `1px solid ${areaFilter === area.id ? area.color : 'var(--border)'}`,
                  background:
                    areaFilter === area.id ? `${area.color}18` : 'var(--surface-2)',
                  color: areaFilter === area.id ? area.color : 'var(--text-secondary)',
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: area.color }}
                />
                {area.name}
              </button>
            ))}

            {/* Priority pills */}
            <button
              onClick={() => setPriorityFilter(null)}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all"
              style={{
                border: `1px solid ${priorityFilter === null ? 'var(--text-secondary)' : 'var(--border)'}`,
                background: priorityFilter === null ? 'var(--surface-3)' : 'var(--surface-2)',
                color: 'var(--text-secondary)',
              }}
            >
              All pri
            </button>
            {(['P0', 'P1', 'P2', 'P3'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
                className="px-2.5 py-0.5 rounded-full text-xs font-bold transition-all"
                style={{
                  border: `1px solid ${priorityFilter === p ? PRIORITY_COLORS[p] : 'var(--border)'}`,
                  background:
                    priorityFilter === p ? `${PRIORITY_COLORS[p]}18` : 'var(--surface-2)',
                  color: priorityFilter === p ? PRIORITY_COLORS[p] : 'var(--text-secondary)',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Test list */}
          <div className="divide-y overflow-y-auto" style={{ borderTop: '1px solid var(--border)', maxHeight: 380 }}>
            {availableTests.length === 0 ? (
              <div className="py-10 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No matching tests
              </div>
            ) : (
              availableTests.map((tc) => {
                const stepCount = countSteps(tc.steps)
                const secs = estimateSeconds(tc.steps)
                const area = tc.areaId ? areaMap[tc.areaId] : null
                return (
                  <div
                    key={tc.id}
                    className="flex items-center gap-3 px-4 py-2.5 group cursor-pointer transition-colors"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--surface-2)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                    onClick={() => addTest(tc)}
                  >
                    <button
                      className="h-5 w-5 rounded flex items-center justify-center shrink-0 transition-all"
                      style={{
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface-2)',
                        color: 'var(--text-tertiary)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        addTest(tc)
                      }}
                    >
                      <span className="text-xs font-bold leading-none">+</span>
                    </button>

                    <span
                      className="text-[10px] font-mono font-bold shrink-0"
                      style={{ color: 'var(--text-tertiary)', minWidth: 36 }}
                    >
                      {tNum(tc)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {tc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {area && (
                          <span
                            className="text-[10px] font-medium flex items-center gap-1"
                            style={{ color: area.color }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: area.color }}
                            />
                            {area.name}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {stepCount} step{stepCount !== 1 ? 's' : ''} · {fmtTime(secs)}
                        </span>
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background: `${PRIORITY_COLORS[tc.priority]}18`,
                        color: PRIORITY_COLORS[tc.priority] ?? 'var(--text-secondary)',
                      }}
                    >
                      {tc.priority}
                    </span>

                    <span style={{ color: 'var(--text-tertiary)' }} className="text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* In This Suite */}
        <div
          className="flex-1 rounded-2xl overflow-hidden"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface-1)',
            minWidth: 0,
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)' }}
            >
              In This Suite
            </span>
            <div className="flex items-center gap-3">
              {suiteTests.length > 1 && (
                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  Drag{' '}
                  <GripVertical className="inline h-3 w-3" />
                  {' '}to reorder
                </span>
              )}
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
              >
                {suiteTests.length}
              </span>
            </div>
          </div>

          <div
            className="divide-y overflow-y-auto"
            style={{ borderTop: '1px solid var(--border)', maxHeight: 455 }}
          >
            {suiteTests.length === 0 ? (
              <div
                className="py-16 flex flex-col items-center gap-2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ border: '2px dashed var(--border)' }}
                >
                  <span className="text-lg">+</span>
                </div>
                <p className="text-sm">Click tests to add them here</p>
              </div>
            ) : (
              suiteTests.map((tc, idx) => {
                const stepCount = countSteps(tc.steps)
                const secs = estimateSeconds(tc.steps)
                const area = tc.areaId ? areaMap[tc.areaId] : null
                return (
                  <div
                    key={tc.id}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDrop={onDrop}
                    className="flex items-center gap-3 px-4 py-2.5 group transition-colors"
                    style={{ cursor: 'grab', background: 'transparent' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--surface-2)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <span
                      className="text-[10px] font-mono font-bold shrink-0 w-4 text-right"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {idx + 1}
                    </span>

                    <GripVertical
                      className="h-3.5 w-3.5 shrink-0 opacity-30 group-hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--text-tertiary)' }}
                    />

                    <span
                      className="text-[10px] font-mono font-bold shrink-0"
                      style={{ color: 'var(--text-tertiary)', minWidth: 36 }}
                    >
                      {tNum(tc)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {tc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {area && (
                          <span
                            className="text-[10px] font-medium flex items-center gap-1"
                            style={{ color: area.color }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: area.color }}
                            />
                            {area.name}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {stepCount} step{stepCount !== 1 ? 's' : ''} · {fmtTime(secs)}
                        </span>
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background: `${PRIORITY_COLORS[tc.priority]}18`,
                        color: PRIORITY_COLORS[tc.priority] ?? 'var(--text-secondary)',
                      }}
                    >
                      {tc.priority}
                    </span>

                    <button
                      onClick={() => removeTest(tc.id)}
                      className="h-5 w-5 rounded flex items-center justify-center shrink-0 transition-all opacity-0 group-hover:opacity-100"
                      style={{
                        border: '1px solid var(--border)',
                        background: 'var(--surface-2)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-3 shrink-0" style={{ width: 180 }}>
          {/* Suite size donut */}
          <div
            className="rounded-2xl p-4 flex flex-col items-center gap-2"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-1)' }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-widest self-start"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Suite Size
            </span>
            <div className="relative flex items-center justify-center">
              <svg width={88} height={88} viewBox="0 0 88 88">
                <circle
                  cx={44}
                  cy={44}
                  r={radius}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={8}
                />
                <circle
                  cx={44}
                  cy={44}
                  r={radius}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth={8}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 44 44)"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)', lineHeight: 1 }}>
                  {suitePct}%
                </p>
              </div>
            </div>
            <p className="text-[11px] text-center" style={{ color: 'var(--text-secondary)' }}>
              {suiteTests.length} of {totalLibraryTests} library tests
            </p>
          </div>

          {/* Run preview */}
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{ border: '1px solid var(--border)', background: 'var(--surface-1)' }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-widest block"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Run Preview
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Est. runtime</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {suiteTests.length === 0 ? '—' : `~${fmtTime(totalSecs)}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>P0 cases</span>
                <span className="font-semibold" style={{ color: p0Count > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                  {p0Count}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Cadence</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {cadenceLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Ready status */}
          <div
            className="rounded-2xl p-4"
            style={{
              border: `1px solid ${isReady ? '#22c55e' : 'var(--border)'}`,
              background: isReady ? 'rgba(34,197,94,0.06)' : 'var(--surface-1)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {isReady ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#22c55e' }} />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              )}
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: isReady ? '#22c55e' : 'var(--text-tertiary)' }}
              >
                {isReady ? 'Ready to Create' : 'Incomplete'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {isReady
                ? `All required fields are set. First run kicks off on the next push to main.`
                : `Add a suite name and at least one test case to continue.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
