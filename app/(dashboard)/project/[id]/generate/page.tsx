'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, Save, ChevronDown, ChevronUp, History, Check,
  FileText, BookOpen, Code2,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useTopbarActions } from '@/components/topbar-actions-provider'

const ONBOARDING_EXAMPLE = `User can register with email and password. Password requires 8+ characters, one uppercase letter, and one number. Email must be unique across all accounts. After registration, user receives a confirmation email. Until confirmed, the user can log in but sees a banner prompting them to verify their email.`

const INPUT_MODES = [
  { id: 'free-text', label: 'Free text', icon: FileText },
  { id: 'user-story', label: 'User story', icon: BookOpen },
  { id: 'api-spec', label: 'API spec', icon: Code2 },
] as const

type InputMode = typeof INPUT_MODES[number]['id']

const CATEGORY_OPTIONS = ['Functional', 'Negative', 'Boundary', 'Security', 'Performance', 'Accessibility']
const COUNT_OPTIONS = [3, 5, 6, 8, 10, 15, 20]

interface GeneratedTestCase {
  title: string
  preconditions: string
  steps: string[]
  expected_result: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  category: string
  why: string
  selected: boolean
  expanded: boolean
}

interface Area { id: string; name: string; color: string }

const PRIORITY_COLORS = {
  P0: 'p0', P1: 'p1', P2: 'p2', P3: 'p3',
} as const

export default function GeneratePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === '1'
  const replayId = searchParams.get('replay')
  const { setActions } = useTopbarActions()

  const [description, setDescription] = useState(isOnboarding ? ONBOARDING_EXAMPLE : '')
  const [inputMode, setInputMode] = useState<InputMode>('free-text')

  useEffect(() => {
    if (!replayId) return
    fetch(`/api/projects/${id}/generate/session/${replayId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.inputText) setDescription(data.inputText) })
  }, [replayId, id])

  const [areas, setAreas] = useState<Area[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState('__none__')
  const [priorityFloor, setPriorityFloor] = useState('P2')
  const [selectedCategories, setSelectedCategories] = useState(['Functional', 'Negative'])
  const [count, setCount] = useState(6)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const categoriesRef = useRef<HTMLDivElement>(null)
  const [historyCount, setHistoryCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${id}/areas`)
      .then((r) => r.ok ? r.json() : { areas: [] })
      .then((d) => setAreas(d.areas ?? []))
    fetch(`/api/projects/${id}/generate`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.count != null) setHistoryCount(d.count) })
      .catch(() => {})
  }, [id])

  // Inject history link into topbar
  useEffect(() => {
    setActions(
      <Link
        href={`/project/${id}/generate/history`}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
      >
        <History className="h-3.5 w-3.5" />
        History{historyCount != null ? ` (${historyCount})` : ''}
      </Link>
    )
    return () => setActions(null)
  }, [id, historyCount, setActions])

  // Close categories dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testCases, setTestCases] = useState<GeneratedTestCase[]>([])

  useEffect(() => {
    if (isOnboarding && description.length >= 10) handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleGenerate() {
    if (description.trim().length < 10) {
      toast.error('Description too short — add at least 10 characters.')
      return
    }
    setGenerating(true)
    setTestCases([])
    try {
      const res = await fetch(`/api/projects/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureDescription: description,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          priorityFloor: priorityFloor !== 'P3' ? priorityFloor : undefined,
          count,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if ((res.status === 429 || res.status === 403) && data.error === 'LIMIT_REACHED') {
          throw new Error(data.message ?? 'Daily AI generation limit reached. Upgrade to Pro for more.')
        }
        throw new Error(data.error ?? 'Generation failed')
      }
      setTestCases(
        data.testCases.map((tc: Omit<GeneratedTestCase, 'selected' | 'expanded'>) => ({
          ...tc, selected: true, expanded: false,
        }))
      )
      setHistoryCount((n) => (n ?? 0) + 1)
      toast.success(`${data.testCases.length} test cases generated`)
    } catch (err: unknown) {
      toast.error('Generation failed', { description: String(err) })
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveSelected() {
    const selected = testCases.filter((tc) => tc.selected)
    if (selected.length === 0) { toast.error('Select at least one test case to save.'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${id}/tests/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaId: selectedAreaId !== '__none__' ? selectedAreaId : undefined,
          testCases: selected.map((tc) => ({
            title: tc.title,
            preconditions: tc.preconditions,
            steps: tc.steps,
            expectedResult: tc.expected_result,
            priority: tc.priority,
            category: tc.category,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.saved} test cases saved`)
      router.push(`/project/${id}`)
    } catch (err: unknown) {
      toast.error('Save failed', { description: String(err) })
    } finally {
      setSaving(false)
    }
  }

  function toggleSelect(idx: number) {
    setTestCases((prev) => prev.map((tc, i) => i === idx ? { ...tc, selected: !tc.selected } : tc))
  }

  function toggleExpand(idx: number) {
    setTestCases((prev) => prev.map((tc, i) => i === idx ? { ...tc, expanded: !tc.expanded } : tc))
  }

  function moveCase(idx: number, dir: 'up' | 'down') {
    setTestCases((prev) => {
      const next = [...prev]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= next.length) return prev
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const selectedCount = testCases.filter((tc) => tc.selected).length
  const selectedArea = areas.find((a) => a.id === selectedAreaId)
  const creditCost = 1

  return (
    <div className="flex gap-5 items-start animate-fade-up">

      {/* ── LEFT PANEL ── */}
      <div
        className="w-[460px] shrink-0 rounded-2xl flex flex-col"
        style={{
          background: 'var(--surface-0)',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div className="p-6 space-y-5">

          {/* Section header */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
              style={{ color: '#10b981' }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full inline-block"
                style={{ background: '#10b981' }}
              />
              AI Studio
            </p>
            <h1
              className="text-2xl font-bold leading-tight"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Generate{' '}
              <span style={{ color: '#10b981' }}>test cases</span>
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
              Describe what to cover. Sonnet maps it to your areas, categories, and severities.
            </p>
          </div>

          {/* Input mode tabs */}
          <div
            className="flex gap-0.5 p-0.5 rounded-lg"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            {INPUT_MODES.map(({ id: modeId, label, icon: Icon }) => (
              <button
                key={modeId}
                onClick={() => setInputMode(modeId)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-all"
                style={{
                  background: inputMode === modeId ? 'var(--surface-0)' : 'transparent',
                  color: inputMode === modeId ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: inputMode === modeId ? 600 : 500,
                  boxShadow: inputMode === modeId ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {/* Textarea + footer */}
          <div className="space-y-1.5">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                inputMode === 'free-text'
                  ? 'Describe the feature or user flow to generate test cases for...'
                  : inputMode === 'user-story'
                  ? 'As a [role], I want [feature] so that [benefit].\n\nAcceptance criteria:\n- ...'
                  : 'Paste your API endpoint spec, OpenAPI YAML, or describe the API contract...'
              }
              rows={7}
              maxLength={5000}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                Sonnet · 200K context
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                {description.length} chars
              </span>
            </div>
          </div>

          {/* Generation settings */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Generation settings
            </p>
            <div className="grid grid-cols-2 gap-3">

              {/* AREA */}
              <div className="space-y-1">
                <label
                  className="text-[10px] font-bold uppercase tracking-widest block"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Area
                </label>
                <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue>
                      {selectedArea ? (
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ background: selectedArea.color }}
                          />
                          {selectedArea.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>No area</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No area</SelectItem>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: a.color }} />
                          {a.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PRIORITY FLOOR */}
              <div className="space-y-1">
                <label
                  className="text-[10px] font-bold uppercase tracking-widest block"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Priority floor
                </label>
                <Select value={priorityFloor} onValueChange={setPriorityFloor}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P0">P0 only</SelectItem>
                    <SelectItem value="P1">P1+</SelectItem>
                    <SelectItem value="P2">P2+</SelectItem>
                    <SelectItem value="P3">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* CATEGORIES */}
              <div className="space-y-1" ref={categoriesRef}>
                <label
                  className="text-[10px] font-bold uppercase tracking-widest block"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Categories
                </label>
                <div className="relative">
                  <button
                    onClick={() => setCategoriesOpen((o) => !o)}
                    className="w-full h-8 flex items-center justify-between px-3 rounded-lg text-xs"
                    style={{
                      background: 'var(--surface-0)',
                      border: '1px solid var(--border)',
                      color: selectedCategories.length ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    }}
                  >
                    <span className="truncate">
                      {selectedCategories.length === 0 ? 'All categories' : selectedCategories.join(', ')}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 ml-1" style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                  {categoriesOpen && (
                    <div
                      className="absolute z-20 top-full mt-1 w-full rounded-lg py-1 shadow-lg"
                      style={{
                        background: 'var(--surface-0)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <label
                          key={cat}
                          className="flex items-center gap-2.5 px-3 py-1.5 text-xs cursor-pointer select-none"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                            className="h-3.5 w-3.5 cursor-pointer"
                            style={{ accentColor: '#7c3aed' }}
                          />
                          {cat}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* COUNT */}
              <div className="space-y-1">
                <label
                  className="text-[10px] font-bold uppercase tracking-widest block"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Count
                </label>
                <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNT_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} cases</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>

        </div>

        {/* Generate button */}
        <div className="px-6 pb-6">
          <div className="h-px mb-5" style={{ background: 'var(--border)' }} />
          <button
            onClick={handleGenerate}
            disabled={generating || description.trim().length < 10}
            className="w-full h-11 rounded-xl flex items-center justify-between px-4 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 55%, #2563eb 100%)',
              boxShadow: generating ? 'none' : '0 2px 12px rgba(99,102,241,0.35)',
            }}
          >
            <span className="flex items-center gap-2.5">
              <Sparkles className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
              {generating ? 'Generating…' : 'Generate test cases'}
            </span>
            <span className="text-xs opacity-70">
              –{creditCost} credit
            </span>
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 min-w-0 space-y-3">

        {/* Generating skeleton */}
        {generating && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest animate-pulse"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Generating {count} cases…
              </span>
            </div>
            {[...Array(count)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="skeleton h-4 w-4 rounded-full shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <div className="skeleton h-5 w-10 rounded-md" />
                      <div className="skeleton h-5 w-24 rounded-md" />
                      <div className="skeleton h-5 w-20 rounded-md" />
                    </div>
                    <div className="skeleton h-4 rounded" style={{ width: `${60 + (i % 4) * 9}%` }} />
                    <div className="skeleton h-3 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {!generating && testCases.length === 0 && (
          <div
            className="rounded-2xl flex flex-col items-center justify-center text-center py-24"
            style={{
              background: 'var(--surface-0)',
              border: '1px dashed var(--border)',
            }}
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)',
                border: '1px solid #e9d5ff',
              }}
            >
              <Sparkles className="h-6 w-6" style={{ color: '#7c3aed' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              No test cases yet
            </p>
            <p className="text-xs mt-1.5 max-w-[240px]" style={{ color: 'var(--text-tertiary)' }}>
              Describe your feature on the left and click Generate to see AI-crafted test cases here
            </p>
          </div>
        )}

        {/* Results */}
        {!generating && testCases.length > 0 && (
          <>
            {/* Results toolbar */}
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                style={{ color: '#10b981' }}
              >
                <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: '#10b981' }} />
                Generated · {testCases.length} cases
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {selectedCount} selected
                </span>
                <button
                  onClick={() => setTestCases((p) => p.map((tc) => ({ ...tc, selected: true })))}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  Select all
                </button>
                <button
                  onClick={handleSaveSelected}
                  disabled={saving || selectedCount === 0}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#0f172a' }}
                >
                  <Save className="h-3 w-3" />
                  {saving ? 'Saving…' : `Save ${selectedCount}`}
                </button>
              </div>
            </div>

            {/* Cards */}
            {testCases.map((tc, idx) => (
              <div
                key={idx}
                className="rounded-xl overflow-hidden transition-all duration-150"
                style={{
                  background: tc.selected ? 'rgba(16,185,129,0.04)' : 'var(--surface-0)',
                  border: `1px solid ${tc.selected ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">

                    {/* Check circle */}
                    <button
                      onClick={() => toggleSelect(idx)}
                      className="mt-0.5 h-4 w-4 rounded-full shrink-0 flex items-center justify-center transition-all"
                      style={{
                        background: tc.selected ? '#10b981' : 'transparent',
                        border: `2px solid ${tc.selected ? '#10b981' : 'var(--border)'}`,
                      }}
                    >
                      {tc.selected && <Check className="h-2.5 w-2.5 text-white" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <Badge variant={PRIORITY_COLORS[tc.priority as keyof typeof PRIORITY_COLORS] ?? 'p2'}>
                          {tc.priority}
                        </Badge>
                        {selectedArea && (
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                            style={{
                              background: 'var(--surface-1)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ background: selectedArea.color }}
                            />
                            {selectedArea.name}
                          </span>
                        )}
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                          style={{
                            background: 'var(--surface-1)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {tc.category.toLowerCase()}
                        </span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {tc.title}
                      </p>
                      {tc.why && (
                        <p className="text-xs mt-1.5 flex items-start gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                          <span className="font-mono text-[10px] opacity-40 shrink-0 mt-px">::</span>
                          <span>
                            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Why:</span>
                            {' '}{tc.why}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Reorder arrows */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => moveCase(idx, 'up')}
                        disabled={idx === 0}
                        className="h-5 w-5 flex items-center justify-center rounded transition-colors disabled:opacity-20"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--surface-2)' }}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => moveCase(idx, 'down')}
                        disabled={idx === testCases.length - 1}
                        className="h-5 w-5 flex items-center justify-center rounded transition-colors disabled:opacity-20"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--surface-2)' }}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>

                  </div>

                  {/* Expanded detail */}
                  {tc.expanded && (
                    <div
                      className="mt-3 pt-3 ml-7 space-y-3"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      {tc.preconditions && (
                        <div>
                          <p
                            className="text-[10px] font-bold uppercase tracking-wider mb-1"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            Preconditions
                          </p>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {tc.preconditions}
                          </p>
                        </div>
                      )}
                      <div>
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider mb-1"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          Steps
                        </p>
                        <ol className="space-y-1">
                          {tc.steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <span
                                className="shrink-0 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                                style={{ background: 'var(--surface-2)', color: 'var(--text-tertiary)' }}
                              >
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider mb-1"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          Expected Result
                        </p>
                        <p
                          className="text-xs leading-relaxed px-3 py-2 rounded-lg"
                          style={{
                            color: 'var(--text-secondary)',
                            background: 'var(--surface-1)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {tc.expected_result}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(idx)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition-colors"
                  style={{
                    borderTop: '1px solid var(--border)',
                    color: 'var(--text-tertiary)',
                    background: 'var(--surface-1)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-1)')}
                >
                  {tc.expanded
                    ? <><ChevronUp className="h-3 w-3" /> Hide steps</>
                    : <><ChevronDown className="h-3 w-3" /> View steps</>
                  }
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
