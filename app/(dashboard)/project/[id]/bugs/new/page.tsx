'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight, Plus, Sparkles, GripVertical,
  X, Video, Code2, AtSign, FileText, Bug, Upload,
  Play, GitBranch, Ticket, FlaskConical, ChevronDown,
  RefreshCw, Camera,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import BugRecordingDialog, { type BugRecordingResult } from '@/components/bug-recording-dialog'
import { cn } from '@/lib/utils'

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

interface DuplicateBug {
  id: string
  title: string
  description: string | null
  sequenceNum: number
  matchPercent: number
}

const SEVERITY_OPTIONS: {
  value: Severity
  label: string
  description: string
  selectedBg: string
  selectedBorder: string
  selectedText: string
  radioColor: string
  badgeBg: string
  badgeText: string
}[] = [
  {
    value: 'CRITICAL',
    label: 'Critical',
    description: 'Blocks revenue / data loss',
    selectedBg: 'bg-red-50',
    selectedBorder: 'border-red-400',
    selectedText: 'text-red-700',
    radioColor: 'border-red-500 bg-red-500',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-600',
  },
  {
    value: 'HIGH',
    label: 'High',
    description: 'Major flow degraded',
    selectedBg: 'bg-orange-50',
    selectedBorder: 'border-orange-400',
    selectedText: 'text-orange-700',
    radioColor: 'border-orange-500 bg-orange-500',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-600',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    description: 'Workaround exists',
    selectedBg: 'bg-blue-50',
    selectedBorder: 'border-blue-400',
    selectedText: 'text-blue-700',
    radioColor: 'border-blue-500 bg-blue-500',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-600',
  },
  {
    value: 'LOW',
    label: 'Low',
    description: 'Cosmetic / nice-to-have',
    selectedBg: 'bg-slate-50',
    selectedBorder: 'border-slate-300',
    selectedText: 'text-slate-600',
    radioColor: 'border-slate-400 bg-slate-400',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-500',
  },
]

const MOCK_CONSOLE_ERRORS = [
  { type: 'error', text: 'TypeError: total.toFixed is not a function' },
  { type: 'trace', text: 'at applySurcharge (checkout.js:412:21)' },
  { type: 'trace', text: 'at handleSubmit (checkout.js:88:14)' },
  { type: 'warn', text: 'POST /pay/intent 422 (Unprocessable)' },
  { type: 'info', text: "body: { code: 'coupon.already_applied' }" },
  { type: 'error', text: 'Mismatch: cart_total=4813 / charge=4812' },
]

const AUTO_TAGS = ['Safari 17.5', 'macOS 14.5', 'Production', 'Session #8821', 'Build a3f9c2']

export default function NewBugPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamAreaId = searchParams.get('areaId') ?? ''

  const [projectName, setProjectName] = useState('')
  const [areas, setAreas] = useState<{ id: string; name: string; color: string }[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState(searchParamAreaId || '')

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.ok ? r.json() : {})
      .then((d: { name?: string }) => setProjectName(d.name ?? ''))
    fetch(`/api/projects/${id}/areas`)
      .then((r) => r.ok ? r.json() : { areas: [] })
      .then((d) => setAreas(d.areas ?? []))
  }, [id])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<string[]>([''])
  const [stepsCollapsed, setStepsCollapsed] = useState(false)
  const [expectedBehavior, setExpectedBehavior] = useState('')
  const [actualBehavior, setActualBehavior] = useState('')
  const [severity, setSeverity] = useState<Severity>('MEDIUM')
  const [titleHint, setTitleHint] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recordOpen, setRecordOpen] = useState(false)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [aiDraftedFrom, setAiDraftedFrom] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [jiraLink, setJiraLink] = useState('')
  const [testCaseLink, setTestCaseLink] = useState('')
  const [expandedLink, setExpandedLink] = useState<string | null>(null)

  const [duplicate, setDuplicate] = useState<DuplicateBug | null>(null)
  const [duplicateDismissed, setDuplicateDismissed] = useState(false)
  const duplicateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  async function suggestSeverity() {
    if (!title || !description) return
    setSuggesting(true)
    try {
      const res = await fetch(`/api/projects/${id}/bugs/suggest-severity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      const data = await res.json()
      setSeverity(data.severity as Severity)
      if (data.titleHint) setTitleHint(data.titleHint)
    } catch {
      //
    } finally {
      setSuggesting(false)
    }
  }

  useEffect(() => {
    if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current)
    if (title.trim().split(/\s+/).length < 4) {
      setDuplicate(null)
      return
    }
    duplicateTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects/${id}/bugs/find-duplicates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description }),
        })
        const data = await res.json()
        if (data.duplicate) {
          setDuplicate(data.duplicate)
          setDuplicateDismissed(false)
        } else {
          setDuplicate(null)
        }
      } catch {
        //
      }
    }, 1800)
    return () => {
      if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current)
    }
  }, [title, description, id])

  function handleRecordingResult(result: BugRecordingResult) {
    if (result.title && !title) setTitle(result.title)
    if (result.stepsToReproduce.length > 0) setSteps(result.stepsToReproduce)
    if (result.thumbnail) setThumbnail(result.thumbnail)
    const sessionId = `#${Math.floor(Math.random() * 9000) + 1000}`
    setAiDraftedFrom(sessionId)
  }

  function clearDraft() {
    setTitle('')
    setDescription('')
    setSteps([''])
    setExpectedBehavior('')
    setActualBehavior('')
    setThumbnail(null)
    setTitleHint('')
    setAiDraftedFrom(null)
  }

  function addStep() { setSteps((prev) => [...prev, '']) }
  function updateStep(idx: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === idx ? value : s)))
  }
  function removeStep(idx: number) {
    setSteps((prev) => prev.filter((_, i) => i !== idx))
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().replace(/^#/, '')
      if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
      setTagInput('')
    }
  }
  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t))
  }

  async function handleSubmit(asDraft = false) {
    if (!title || !description) {
      toast.error('Title and description are required')
      return
    }
    setSubmitting(true)
    try {
      const attachments = thumbnail ? JSON.stringify({ thumbnail }) : undefined
      const res = await fetch(`/api/projects/${id}/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          stepsToReproduce: steps.filter(Boolean),
          expectedBehavior: expectedBehavior || undefined,
          actualBehavior: actualBehavior || undefined,
          severity,
          areaId: selectedAreaId || undefined,
          attachments,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(asDraft ? 'Draft saved' : 'Bug submitted')
      router.push(
        selectedAreaId
          ? `/project/${id}/area/${selectedAreaId}?tab=bugs`
          : `/project/${id}?tab=bugs`
      )
    } catch (err: unknown) {
      toast.error('Error', { description: String(err) })
    } finally {
      setSubmitting(false)
    }
  }

  function applyFormat(type: 'code' | 'quote') {
    const el = descRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = description.slice(start, end)
    let replacement = ''
    if (type === 'code') {
      replacement = selected.includes('\n')
        ? `\`\`\`\n${selected}\n\`\`\``
        : `\`${selected || 'code'}\``
    } else {
      replacement = selected.split('\n').map((l) => `> ${l}`).join('\n')
    }
    const next = description.slice(0, start) + replacement + description.slice(end)
    setDescription(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + replacement.length, start + replacement.length)
    }, 0)
  }

  const filledSteps = steps.filter(Boolean).length
  const selectedArea = areas.find((a) => a.id === selectedAreaId)

  return (
    <div className="max-w-5xl mx-auto pb-12">

      {/* Page header */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-1">
          {projectName || 'Project'} · Bugs
        </p>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Report a bug</h1>
            <p className="text-xs text-slate-400 mt-1">
              The more you fill in, the faster engineering can pick it up.
              {aiDraftedFrom && ` AI fields are pre-populated from session ${aiDraftedFrom}.`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8 text-slate-600"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
            >
              Save draft
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm gap-1.5"
              onClick={() => handleSubmit(false)}
              disabled={submitting || !title || !description}
            >
              <Bug className="h-3.5 w-3.5" />
              {submitting ? 'Submitting…' : 'Submit bug'}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Draft Banner */}
      {aiDraftedFrom && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800">
              Sonnet drafted this from session {aiDraftedFrom}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Steps, expected/actual and severity were inferred from console errors + DOM events. Review each before submitting.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg px-3 py-1.5 border border-slate-200 hover:bg-slate-50 transition-colors"
              onClick={suggestSeverity}
            >
              <RefreshCw className="h-3 w-3" />
              Re-draft
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg px-3 py-1.5 border border-slate-200 hover:bg-slate-50 transition-colors"
              onClick={clearDraft}
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_264px] gap-5">

        {/* ── Left column ── */}
        <div className="space-y-4">

          {/* Title + Description card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Red accent top bar */}
            <div className="h-0.5 bg-red-400 w-full" />
            <div className="p-5 space-y-4">

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 flex items-center gap-1">
                  Title
                  <span className="text-red-500 text-xs leading-none">•</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={suggestSeverity}
                  placeholder="e.g. Password reset link doesn't expire after use"
                  className="text-sm border-slate-200 focus-visible:ring-slate-300"
                  required
                />
                {titleHint ? (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 shrink-0 text-emerald-500" />
                    AI suggests · {titleHint} — {title.length}/80 chars look good
                  </p>
                ) : suggesting ? (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    Analyzing…
                  </p>
                ) : null}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
                  Description
                </label>
                <Textarea
                  ref={descRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={suggestSeverity}
                  placeholder="Describe the bug in detail…"
                  rows={5}
                  className="text-sm border-slate-200 focus-visible:ring-slate-300 resize-none"
                />
                {/* Format toolbar — separate pill buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Markdown
                  </button>
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      const el = descRef.current
                      if (!el) return
                      const pos = el.selectionStart
                      const next = description.slice(0, pos) + '@' + description.slice(pos)
                      setDescription(next)
                      setTimeout(() => { el.focus(); el.setSelectionRange(pos + 1, pos + 1) }, 0)
                    }}
                  >
                    Mention @
                  </button>
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                    onClick={() => applyFormat('code')}
                  >
                    Code
                  </button>
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
                    onClick={() => applyFormat('quote')}
                  >
                    Quote
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Steps to Reproduce card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <button
              type="button"
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
              onClick={() => setStepsCollapsed((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 text-slate-400 transition-transform',
                    !stepsCollapsed && 'rotate-90'
                  )}
                />
                <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-500">
                  Steps to Reproduce
                </span>
                {filledSteps > 0 && (
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                    {filledSteps}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">Drag · to reorder</span>
            </button>

            {!stepsCollapsed && (
              <div className="px-5 pb-4 space-y-2 border-t border-slate-100">
                <div className="pt-3 space-y-2">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <GripVertical className="h-4 w-4 text-slate-300 shrink-0 cursor-grab active:cursor-grabbing" />
                      <span className="text-xs text-slate-400 w-4 text-right shrink-0 select-none">
                        {idx + 1}
                      </span>
                      <Input
                        value={step}
                        onChange={(e) => updateStep(idx, e.target.value)}
                        placeholder={`Step ${idx + 1}`}
                        className="flex-1 text-sm h-9 border-slate-200"
                      />
                      {steps.length > 1 && (
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all shrink-0"
                          onClick={() => removeStep(idx)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors pt-1"
                  onClick={addStep}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add step
                </button>
              </div>
            )}
          </div>

          {/* Expected / Actual — two side-by-side cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Expected */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border-b border-green-100">
                <span className="text-green-600 font-bold text-sm">✓</span>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-green-700">
                  Expected
                </span>
              </div>
              <div className="p-3">
                <Textarea
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="What should happen?"
                  rows={4}
                  className="text-sm border-0 shadow-none focus-visible:ring-0 resize-none p-0 placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Actual */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100">
                <span className="text-red-500 font-bold text-sm">✕</span>
                <span className="text-[10px] font-semibold tracking-widest uppercase text-red-700">
                  Actual
                </span>
              </div>
              <div className="p-3">
                <Textarea
                  value={actualBehavior}
                  onChange={(e) => setActualBehavior(e.target.value)}
                  placeholder="What actually happens?"
                  rows={4}
                  className="text-sm border-0 shadow-none focus-visible:ring-0 resize-none p-0 placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Evidence card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-500">
                  Evidence
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <button type="button" className="hover:text-slate-600 transition-colors">session-replay</button>
                <span>·</span>
                <button type="button" className="hover:text-slate-600 transition-colors">console</button>
                <span>·</span>
                <button type="button" className="hover:text-slate-600 transition-colors">network</button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Recording drop zone */}
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  {thumbnail ? (
                    <div className="relative">
                      <img
                        src={thumbnail}
                        alt="Recording thumbnail"
                        className="w-full object-cover"
                        style={{ maxHeight: 130 }}
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                        <Video className="h-2.5 w-2.5" />
                        Recorded
                      </div>
                      <button
                        type="button"
                        onClick={() => setThumbnail(null)}
                        className="absolute top-2 right-2 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center py-9 px-4 text-center"
                      style={{
                        background: 'repeating-linear-gradient(-45deg, #f8fafc, #f8fafc 6px, #f1f5f9 6px, #f1f5f9 12px)',
                      }}
                    >
                      <div className="h-10 w-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-2">
                        <Play className="h-4 w-4 text-slate-400 translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400">drop recording · 00:00 captured</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 px-3 py-2 border-t border-slate-100 bg-white">
                    <button
                      type="button"
                      onClick={() => setRecordOpen(true)}
                      className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <Video className="h-3 w-3" />
                      Record now
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <Upload className="h-3 w-3" />
                      Upload
                    </button>
                  </div>
                </div>

                {/* Console errors panel */}
                <div className="rounded-lg overflow-hidden" style={{ background: '#0f1117' }}>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">console</span>
                    <span className="text-[9px] bg-red-500/20 text-red-400 rounded px-1.5 py-0.5 font-mono">
                      {MOCK_CONSOLE_ERRORS.filter((e) => e.type === 'error').length} errors
                    </span>
                  </div>
                  <div className="p-3 space-y-1 font-mono text-[10px] leading-relaxed">
                    {MOCK_CONSOLE_ERRORS.map((entry, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-start gap-1.5',
                          entry.type === 'error' && 'text-red-400',
                          entry.type === 'warn' && 'text-amber-400',
                          entry.type === 'trace' && 'text-slate-600 pl-3',
                          entry.type === 'info' && 'text-slate-600 pl-3',
                        )}
                      >
                        {entry.type === 'error' && <span className="shrink-0 mt-px">×</span>}
                        {entry.type === 'warn' && <span className="shrink-0 mt-px">▲</span>}
                        <span className="break-all">{entry.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Auto-attached tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-slate-400">Auto-attached</span>
                {AUTO_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* Severity */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
              Severity <span className="text-red-500">•</span>
            </label>
            <div className="space-y-1.5">
              {SEVERITY_OPTIONS.map((opt) => {
                const isSelected = severity === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all shadow-sm',
                      isSelected
                        ? `${opt.selectedBg} ${opt.selectedBorder}`
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span
                      className={cn(
                        'h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        isSelected ? opt.radioColor : 'border-slate-300 bg-white'
                      )}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={cn('text-sm font-medium leading-tight', isSelected ? opt.selectedText : 'text-slate-700')}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{opt.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Possible Duplicate */}
          {duplicate && !duplicateDismissed && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-amber-200/60">
                <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-700">
                  Possible Duplicate
                </span>
                <span className="text-[10px] font-bold text-amber-600">
                  {duplicate.matchPercent}% match
                </span>
              </div>
              <div className="p-3.5 space-y-3">
                <p className="text-[11px] text-amber-700">
                  Sonnet found an open bug that looks very similar.
                </p>
                <div className="bg-white border border-amber-100 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 font-mono font-semibold">
                      BUG-{String(duplicate.sequenceNum).padStart(3, '0')}
                    </span>
                    <span className="text-[9px] bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-medium">
                      critical
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-snug">{duplicate.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/project/${id}/bugs/${duplicate.id}`}
                    target="_blank"
                    className="flex-1 text-center text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50 transition-colors"
                  >
                    Link as related
                  </Link>
                  <button
                    type="button"
                    className="flex-1 text-center text-[11px] text-white bg-amber-500 hover:bg-amber-600 rounded-lg py-1.5 transition-colors font-medium"
                    onClick={() => setDuplicateDismissed(true)}
                  >
                    Merge Into
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Triage */}
          <div className="space-y-3">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
              Triage
            </label>

            {/* Area */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Area</p>
              <div className="relative">
                {selectedArea && (
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full pointer-events-none z-10"
                    style={{ background: selectedArea.color }}
                  />
                )}
                <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className={cn(
                    'w-full h-9 text-sm border border-slate-200 rounded-xl bg-white text-slate-700',
                    'appearance-none focus:outline-none focus:ring-2 focus:ring-slate-300',
                    'pr-8 shadow-sm transition-colors hover:border-slate-300',
                    selectedArea ? 'pl-7' : 'pl-3'
                  )}
                >
                  <option value="">None</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Assignee</p>
              <div className="flex items-center gap-2 h-9 px-3 border border-slate-200 rounded-xl bg-white shadow-sm">
                <div className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[9px] font-semibold text-slate-400">
                  ?
                </div>
                <span className="text-sm text-slate-400 flex-1">Unassigned</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-300 shrink-0" />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
              Tags
            </label>
            <div className="min-h-[36px] flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="add tag..."
                className="text-xs text-slate-500 placeholder:text-slate-300 outline-none bg-transparent min-w-[60px] flex-1"
              />
            </div>
          </div>

          {/* Link (optional) */}
          <div className="space-y-2">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
              Link{' '}
              <span className="font-normal normal-case tracking-normal text-slate-300">(optional)</span>
            </label>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm divide-y divide-slate-100">

              {/* GitHub */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedLink(expandedLink === 'github' ? null : 'github')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <GitBranch className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    GitHub PR or issue
                  </div>
                  <Plus className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {expandedLink === 'github' && (
                  <div className="px-3.5 pb-3">
                    <Input
                      value={githubLink}
                      onChange={(e) => setGithubLink(e.target.value)}
                      placeholder="https://github.com/..."
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Jira */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedLink(expandedLink === 'jira' ? null : 'jira')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Ticket className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Jira ticket
                  </div>
                  <Plus className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {expandedLink === 'jira' && (
                  <div className="px-3.5 pb-3">
                    <Input
                      value={jiraLink}
                      onChange={(e) => setJiraLink(e.target.value)}
                      placeholder="https://yourorg.atlassian.net/..."
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Failing test case */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedLink(expandedLink === 'testcase' ? null : 'testcase')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <FlaskConical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Failing test case
                  </div>
                  <Plus className="h-3.5 w-3.5 text-slate-400" />
                </button>
                {expandedLink === 'testcase' && (
                  <div className="px-3.5 pb-3">
                    <Input
                      value={testCaseLink}
                      onChange={(e) => setTestCaseLink(e.target.value)}
                      placeholder="Test case name or URL"
                      className="h-7 text-xs"
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      <BugRecordingDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        projectId={id}
        onResult={handleRecordingResult}
      />
    </div>
  )
}
