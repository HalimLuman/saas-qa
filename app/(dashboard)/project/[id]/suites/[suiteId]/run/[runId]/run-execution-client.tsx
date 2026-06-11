'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type RunResult = 'NOT_RUN' | 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED'
type AutoStatus = 'RUNNING' | 'PASSED' | 'FAILED' | 'ERROR' | null

interface StepLog {
  action: string
  status: 'ok' | 'error' | 'info'
  error?: string
}

interface TestCaseInfo {
  id: string
  title: string
  priority: string
  module: string | null
  preconditions: string | null
  steps: string
  expectedResult: string
}

interface ResultRow {
  testCaseId: string
  result: RunResult
  notes: string
  autoLog: StepLog[] | null
  autoStatus: string | null
  screenshot: string | null
  testCase: TestCaseInfo
}

const ACTIONS = [
  { result: 'PASSED'  as RunResult, label: 'PASS',    key: 'p', icon: '✓', color: '#16a34a', bg: 'rgba(22,163,74,0.12)',    border: 'rgba(22,163,74,0.35)'    },
  { result: 'FAILED'  as RunResult, label: 'FAIL',    key: 'f', icon: '×', color: '#dc2626', bg: 'rgba(220,38,38,0.12)',    border: 'rgba(220,38,38,0.35)'    },
  { result: 'SKIPPED' as RunResult, label: 'SKIP',    key: 's', icon: '◎', color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.35)'  },
  { result: 'BLOCKED' as RunResult, label: 'BLOCKED', key: 'b', icon: '‖', color: '#d97706', bg: 'rgba(217,119,6,0.12)',    border: 'rgba(217,119,6,0.35)'    },
]

const PRIORITY_COLOR: Record<string, string> = { P0: '#ef4444', P1: '#f97316', P2: '#3b82f6', P3: '#94a3b8' }

function DonutChart({ pct, done, total }: { pct: number; done: number; total: number }) {
  const size = 148, stroke = 13
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      <defs>
        <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(99,120,200,0.1)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#dg)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: 'var(--text-primary)', fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </text>
      <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: 'var(--text-tertiary)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em' }}>
        OF RUN
      </text>
      <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>
        {done}/{total} done
      </text>
    </svg>
  )
}

const SPIN_CSS = `@keyframes _qa_spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`

function Spinner({ size = 12 }: { size?: number }) {
  return (
    <>
      <style>{SPIN_CSS}</style>
      <span style={{
        display: 'inline-block', width: size, height: size,
        border: `2px solid rgba(99,120,200,0.25)`,
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: '_qa_spin 0.7s linear infinite',
        flexShrink: 0,
      }} />
    </>
  )
}

// ── Auto-run modal ─────────────────────────────────────────────────────────────

function AutoRunModal({ onStart, onClose }: { onStart: (targetUrl: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState('http://localhost:3000')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    onStart(trimmed)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: 460, padding: '28px 28px 24px', borderRadius: 16 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Auto Run</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22, lineHeight: 1.5 }}>
          The AI will open a browser, follow each test step, and mark results automatically. Only <strong>NOT_RUN</strong> cases will be executed.
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>BASE URL</label>
            <input
              autoFocus type="url" value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://your-app.com"
              style={{ height: 38, padding: '0 12px', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14, background: 'var(--surface-1)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.15s' }}
              onFocus={e => (e.target.style.borderColor = '#3b82f6')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
              The app will navigate relative paths (e.g. /login) against this URL.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ height: 36, padding: '0 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={!url.trim()} style={{ height: 36, padding: '0 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', cursor: url.trim() ? 'pointer' : 'not-allowed', opacity: url.trim() ? 1 : 0.5, boxShadow: '0 4px 14px rgba(109,40,217,0.3)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 15 }}>⚡</span>Start Auto Run
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Screenshot fullscreen modal ────────────────────────────────────────────────

function ScreenshotModal({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: -12, right: -12, zIndex: 1, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >×</button>
        <img
          src={`data:image/jpeg;base64,${src}`}
          alt="Test screenshot"
          style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, display: 'block', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
        />
      </div>
    </div>
  )
}

// ── Report Bug modal ───────────────────────────────────────────────────────────

const SEVERITY_MAP: { value: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; label: string; color: string; bg: string }[] = [
  { value: 'CRITICAL', label: 'Critical', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  { value: 'HIGH',     label: 'High',     color: '#ea580c', bg: 'rgba(234,88,12,0.08)' },
  { value: 'MEDIUM',   label: 'Medium',   color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  { value: 'LOW',      label: 'Low',      color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
]

function parseSteps(rawSteps: string): string[] {
  try {
    const parsed = JSON.parse(rawSteps)
    if (Array.isArray(parsed)) return (parsed as unknown[]).map(String).filter(Boolean)
  } catch { /* not JSON */ }
  return rawSteps
    .split('\n')
    .map(s => s.trim().replace(/^\d+[\.\)]\s*/, ''))
    .filter(Boolean)
}

function ReportBugModal({
  row,
  projectId,
  onClose,
}: {
  row: ResultRow
  projectId: string
  onClose: () => void
}) {
  const [title, setTitle] = useState(row.testCase.title)
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH')
  const [steps, setSteps] = useState<string[]>(() => parseSteps(row.testCase.steps))
  const [expectedBehavior, setExpectedBehavior] = useState(row.testCase.expectedResult)
  const [actualBehavior, setActualBehavior] = useState(row.notes || '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function updateStep(i: number, val: string) { setSteps(prev => prev.map((s, idx) => idx === i ? val : s)) }
  function addStep() { setSteps(prev => [...prev, '']) }
  function removeStep(i: number) { setSteps(prev => prev.filter((_, idx) => idx !== i)) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const description = `Test case "${row.testCase.title}" failed.\n\nActual: ${actualBehavior || 'See steps.'}`
      const res = await fetch(`/api/projects/${projectId}/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description,
          stepsToReproduce: steps.filter(Boolean),
          expectedBehavior: expectedBehavior || undefined,
          actualBehavior: actualBehavior || undefined,
          severity,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Bug reported successfully')
      onClose()
    } catch {
      toast.error('Failed to report bug')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 13,
    background: 'var(--surface-1)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text-primary)', outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{ width: 560, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto', borderRadius: 16, padding: '24px 24px 20px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>🐛 Report Bug</h2>
            <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 3 }}>Pre-filled from the failing test case — edit before submitting</p>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-1)', cursor: 'pointer', fontSize: 16, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = '#3b82f6')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Severity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Severity</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {SEVERITY_MAP.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverity(opt.value)}
                  style={{
                    flex: 1, height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${severity === opt.value ? opt.color : 'var(--border)'}`,
                    background: severity === opt.value ? opt.bg : 'var(--surface-1)',
                    color: severity === opt.value ? opt.color : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Steps to Reproduce</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0, width: 16, textAlign: 'right' }}>{i + 1}.</span>
                  <input
                    value={step}
                    onChange={e => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(i)} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-1)', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addStep} style={{ alignSelf: 'flex-start', fontSize: 11.5, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2, padding: 0 }}>
                + Add step
              </button>
            </div>
          </div>

          {/* Expected / Actual */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#16a34a', textTransform: 'uppercase' }}>✓ Expected</label>
              <textarea
                value={expectedBehavior}
                onChange={e => setExpectedBehavior(e.target.value)}
                rows={3}
                placeholder="What should happen?"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#16a34a')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#dc2626', textTransform: 'uppercase' }}>✗ Actual</label>
              <textarea
                value={actualBehavior}
                onChange={e => setActualBehavior(e.target.value)}
                rows={3}
                placeholder="What actually happened?"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={e => (e.target.style.borderColor = '#dc2626')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ height: 36, padding: '0 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              style={{ height: 36, padding: '0 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: '#dc2626', color: 'white', border: 'none', cursor: submitting || !title.trim() ? 'not-allowed' : 'pointer', opacity: submitting || !title.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              🐛 {submitting ? 'Reporting…' : 'Report Bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Evidence panel ─────────────────────────────────────────────────────────────

function EvidencePanel({
  log,
  screenshot,
  onScreenshotClick,
}: {
  log: StepLog[]
  screenshot: string | null
  onScreenshotClick: (src: string) => void
}) {
  const STEP_ICON: Record<string, string> = { ok: '✓', error: '✗', info: '·' }
  const STEP_COLOR: Record<string, string> = { ok: '#16a34a', error: '#dc2626', info: '#64748b' }

  return (
    <div style={{ padding: '8px 16px 12px', paddingLeft: 68, borderTop: '1px dashed var(--border)', background: 'var(--surface-1)' }}>
      {log.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: screenshot ? 10 : 0 }}>
          {log.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11.5, lineHeight: 1.4 }}>
              <span style={{ color: STEP_COLOR[step.status], fontWeight: 700, flexShrink: 0, marginTop: 1, fontFamily: 'monospace' }}>
                {STEP_ICON[step.status]}
              </span>
              <span style={{ color: step.status === 'error' ? '#dc2626' : 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {step.action}
                {step.error && <span style={{ color: '#dc2626', display: 'block', marginTop: 2, fontSize: 11 }}>↳ {step.error}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
      {screenshot && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Screenshot</p>
          <img
            src={`data:image/jpeg;base64,${screenshot}`}
            alt="Test screenshot"
            onClick={() => onScreenshotClick(screenshot)}
            style={{ maxWidth: 320, maxHeight: 120, borderRadius: 6, border: '1px solid var(--border)', cursor: 'zoom-in', display: 'block', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function RunExecutionClient({
  runId, suiteId, projectId,
  suiteName, startedAt,
  initialResults, initialStatus,
}: {
  runId: string
  suiteId: string
  projectId: string
  suiteName: string
  startedAt: Date
  initialResults: ResultRow[]
  initialStatus: string
}) {
  const router = useRouter()
  const [rows, setRows] = useState<ResultRow[]>(initialResults)
  const [saving, setSaving] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const notesTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const completed = initialStatus === 'COMPLETED'

  // ── Auto-run state
  const [showAutoModal, setShowAutoModal] = useState(false)
  const [autoRunning, setAutoRunning] = useState(false)
  const [autoStatus, setAutoStatus] = useState<Record<string, AutoStatus>>({})
  const [activeTestId, setActiveTestId] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [autoSummary, setAutoSummary] = useState<{ passed: number; failed: number } | null>(null)

  // ── Live log/screenshot state (populated during SSE stream)
  const [stepLogs, setStepLogs] = useState<Record<string, StepLog[]>>({})
  const [screenshots, setScreenshots] = useState<Record<string, string>>({})

  // ── UI state
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null)
  const [reportBugFor, setReportBugFor] = useState<ResultRow | null>(null)

  const counts = rows.reduce<Record<RunResult, number>>(
    (acc, r) => { acc[r.result] = (acc[r.result] || 0) + 1; return acc },
    { NOT_RUN: 0, PASSED: 0, FAILED: 0, BLOCKED: 0, SKIPPED: 0 }
  )
  const total = rows.length
  const done = total - counts.NOT_RUN
  const pct = total ? Math.round((done / total) * 100) : 0

  const startedAgo = (() => {
    const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000)
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff / 60)}h ago`
  })()

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function setResult(testCaseId: string, result: RunResult) {
    setSaving(testCaseId)
    setRows((prev) => prev.map((r) => r.testCaseId === testCaseId ? { ...r, result } : r))
    try {
      const notes = editNotes[testCaseId] ?? rows.find(r => r.testCaseId === testCaseId)?.notes ?? ''
      await fetch(`/api/suites/${suiteId}/runs/${runId}/results/${testCaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, notes: notes || undefined }),
      })
    } catch { toast.error('Failed to save result') }
    finally { setSaving(null) }
  }

  async function saveNotes(testCaseId: string, notes: string) {
    const currentResult = rows.find(r => r.testCaseId === testCaseId)?.result ?? 'NOT_RUN'
    try {
      await fetch(`/api/suites/${suiteId}/runs/${runId}/results/${testCaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: currentResult, notes: notes || undefined }),
      })
    } catch { /* silent */ }
  }

  function handleNotesChange(testCaseId: string, value: string) {
    setEditNotes(prev => ({ ...prev, [testCaseId]: value }))
    setRows(prev => prev.map(r => r.testCaseId === testCaseId ? { ...r, notes: value } : r))
    clearTimeout(notesTimers.current[testCaseId])
    notesTimers.current[testCaseId] = setTimeout(() => saveNotes(testCaseId, value), 800)
  }

  const jumpToNextNotRun = useCallback(() => {
    const idx = rows.findIndex((r, i) => i > cursor && r.result === 'NOT_RUN')
    if (idx !== -1) { setCursor(idx); document.getElementById(`row-${idx}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }
    else {
      const first = rows.findIndex(r => r.result === 'NOT_RUN')
      if (first !== -1) { setCursor(first); document.getElementById(`row-${first}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }
    }
  }, [rows, cursor])

  useEffect(() => {
    if (completed) return
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const row = rows[cursor]
      if (!row) return
      const action = ACTIONS.find(a => a.key === e.key)
      if (action) { e.preventDefault(); setResult(row.testCaseId, action.result) }
      if (e.key === 'n') { e.preventDefault(); jumpToNextNotRun() }
      if (e.key === 'Escape') { router.push(`/project/${projectId}/suites/${suiteId}`) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rows, cursor, completed, jumpToNextNotRun])

  async function completeRun() {
    setCompleting(true)
    try {
      const res = await fetch(`/api/suites/${suiteId}/runs/${runId}`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      toast.success('Run completed')
      router.push(`/project/${projectId}/suites/${suiteId}`)
      router.refresh()
    } catch { toast.error('Failed to complete run') }
    finally { setCompleting(false) }
  }

  // ── Auto-run logic ────────────────────────────────────────────────────────

  async function startAutoRun(targetUrl: string) {
    setAutoRunning(true)
    setAutoSummary(null)
    setAutoStatus({})
    setActiveTestId(null)
    setActiveStep(null)

    try {
      const res = await fetch(`/api/suites/${suiteId}/runs/${runId}/auto-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl }),
      })

      if (!res.ok || !res.body) {
        toast.error('Failed to start auto run')
        setAutoRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as Record<string, unknown>

            if (event.type === 'test_begin') {
              const id = event.testCaseId as string
              setActiveTestId(id)
              setActiveStep('Starting…')
              setAutoStatus(prev => ({ ...prev, [id]: 'RUNNING' }))
              // Reset live log for this test
              setStepLogs(prev => ({ ...prev, [id]: [] }))
              document.getElementById(`row-${rows.findIndex(r => r.testCaseId === id)}`)
                ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }

            if (event.type === 'step') {
              const id = event.testCaseId as string
              const step: StepLog = {
                action: event.action as string,
                status: event.status as 'ok' | 'error' | 'info',
                error: event.error as string | undefined,
              }
              setStepLogs(prev => ({ ...prev, [id]: [...(prev[id] || []), step] }))
              setActiveStep(event.action as string)
            }

            if (event.type === 'test_done') {
              const id = event.testCaseId as string
              const result = event.result as RunResult
              const reason = (event.reason as string) || ''
              const screenshot = event.screenshot as string | undefined
              setAutoStatus(prev => ({ ...prev, [id]: result === 'PASSED' ? 'PASSED' : 'FAILED' }))
              setRows(prev => prev.map(r => r.testCaseId === id ? { ...r, result, notes: reason } : r))
              if (screenshot) setScreenshots(prev => ({ ...prev, [id]: screenshot }))
              setActiveStep(null)
              // Auto-expand evidence for failed tests
              if (result === 'FAILED') {
                setExpanded(prev => { const next = new Set(prev); next.add(id); return next })
              }
            }

            if (event.type === 'error') {
              toast.error(`Auto run error: ${event.message}`)
            }

            if (event.type === 'complete') {
              setActiveTestId(null)
              setActiveStep(null)
              const p = event.passed as number
              const f = event.failed as number
              setAutoSummary({ passed: p, failed: f })
              toast.success(`Auto run complete — ${p} passed, ${f} failed`)
            }
          } catch { /* malformed event */ }
        }
      }
    } catch (err) {
      toast.error(`Auto run failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setAutoRunning(false)
      setActiveTestId(null)
      setActiveStep(null)
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const LEGEND = [
    { label: 'Pass',    count: counts.PASSED,  color: '#16a34a' },
    { label: 'Fail',    count: counts.FAILED,  color: '#dc2626' },
    { label: 'Blocked', count: counts.BLOCKED, color: '#d97706' },
    { label: 'Skipped', count: counts.SKIPPED, color: '#64748b' },
    { label: 'Not run', count: counts.NOT_RUN, color: '#94a3b8' },
  ]

  const SHORTCUTS = [
    { label: 'Pass',    key: 'P' },
    { label: 'Fail',    key: 'F' },
    { label: 'Skip',    key: 'S' },
    { label: 'Blocked', key: 'B' },
    { label: 'Next',    key: 'N' },
    { label: 'Exit',    key: 'Esc' },
  ]

  function AutoBadge({ status }: { status: AutoStatus }) {
    if (!status) return null
    const map: Record<NonNullable<AutoStatus>, { icon: string; color: string; label: string }> = {
      RUNNING: { icon: '⟳', color: '#3b82f6', label: 'Running' },
      PASSED:  { icon: '⚡', color: '#16a34a', label: 'Auto ✓' },
      FAILED:  { icon: '⚡', color: '#dc2626', label: 'Auto ✗' },
      ERROR:   { icon: '⚠', color: '#d97706', label: 'Error'  },
    }
    const m = map[status]
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 20, color: m.color, background: `${m.color}18`, border: `1px solid ${m.color}40`, flexShrink: 0 }}>
        {status === 'RUNNING' ? <Spinner size={9} /> : <span>{m.icon}</span>}
        {m.label}
      </span>
    )
  }

  return (
    <>
      {showAutoModal && <AutoRunModal onStart={startAutoRun} onClose={() => setShowAutoModal(false)} />}
      {fullscreenImg && <ScreenshotModal src={fullscreenImg} onClose={() => setFullscreenImg(null)} />}
      {reportBugFor && <ReportBugModal row={reportBugFor} projectId={projectId} onClose={() => setReportBugFor(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Page header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 16px', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{suiteName}</h1>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3 }}>Started {startedAgo} · {done} of {total} cases marked</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!completed && (
              <button onClick={() => setShowAutoModal(true)} disabled={autoRunning} style={{ height: 34, padding: '0 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: autoRunning ? 'var(--surface-1)' : 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: autoRunning ? 'var(--text-secondary)' : 'white', border: autoRunning ? '1px solid var(--border)' : 'none', cursor: autoRunning ? 'not-allowed' : 'pointer', opacity: autoRunning ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6, boxShadow: autoRunning ? 'none' : '0 4px 14px rgba(109,40,217,0.3)' }}>
                {autoRunning ? <Spinner size={12} /> : <span style={{ fontSize: 14 }}>⚡</span>}
                {autoRunning ? 'Running…' : 'Auto Run'}
              </button>
            )}
            <button onClick={() => router.push(`/project/${projectId}/suites/${suiteId}`)} style={{ height: 34, padding: '0 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Save &amp; exit
            </button>
            {!completed && (
              <button onClick={completeRun} disabled={completing} style={{ height: 34, padding: '0 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', border: 'none', cursor: completing ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', gap: 6, opacity: completing ? 0.7 : 1 }}>
                <span style={{ fontSize: 14 }}>✓</span>{completing ? 'Completing…' : 'Complete run'}
              </button>
            )}
          </div>
        </div>

        {/* Auto-run progress banner */}
        {(autoRunning || autoSummary) && (
          <div style={{ marginBottom: 14, padding: '10px 16px', background: autoRunning ? 'rgba(109,40,217,0.06)' : autoSummary && autoSummary.failed === 0 ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)', border: `1px solid ${autoRunning ? 'rgba(109,40,217,0.2)' : autoSummary && autoSummary.failed === 0 ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            {autoRunning ? <Spinner size={13} /> : <span style={{ fontSize: 15 }}>{autoSummary && autoSummary.failed === 0 ? '✓' : '⚡'}</span>}
            <div style={{ flex: 1, minWidth: 0 }}>
              {autoRunning ? (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>Auto running test cases…</span>
                  {activeStep && <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>{activeStep}</span>}
                </>
              ) : autoSummary && (
                <span style={{ fontSize: 13, fontWeight: 600, color: autoSummary.failed === 0 ? '#16a34a' : '#dc2626' }}>
                  Auto run complete — {autoSummary.passed} passed, {autoSummary.failed} failed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Two-column body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
          {/* Left: cases list */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                Cases <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>{total}</span>
              </span>
              {!completed && counts.NOT_RUN > 0 && (
                <button onClick={jumpToNextNotRun} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Jump to next not run <span style={{ fontSize: 14, lineHeight: 1 }}>›</span>
                </button>
              )}
            </div>

            <div>
              {rows.map((row, idx) => {
                const activeAction = ACTIONS.find(a => a.result === row.result)
                const isCursor = idx === cursor && !completed
                const showNotes = (row.result === 'FAILED' || row.result === 'BLOCKED') && !completed
                const displayNotes = editNotes[row.testCaseId] ?? row.notes
                const rowAutoStatus = autoStatus[row.testCaseId] ?? (row.autoStatus as AutoStatus) ?? null
                const isActiveRow = activeTestId === row.testCaseId

                // Merge live step logs (SSE) with persisted autoLog from DB
                const effectiveLog = (stepLogs[row.testCaseId]?.length ? stepLogs[row.testCaseId] : row.autoLog) ?? []
                const effectiveScreenshot = screenshots[row.testCaseId] ?? row.screenshot ?? null
                const hasEvidence = effectiveLog.length > 0 || !!effectiveScreenshot
                const isExpanded = expanded.has(row.testCaseId)
                const showReportBug = row.result === 'FAILED' || row.result === 'BLOCKED'

                return (
                  <div
                    key={row.testCaseId}
                    id={`row-${idx}`}
                    onClick={() => setCursor(idx)}
                    style={{ borderBottom: '1px solid var(--border)', background: isActiveRow ? 'rgba(109,40,217,0.04)' : isCursor ? 'var(--surface-1)' : 'transparent', transition: 'background 0.1s', cursor: 'default' }}
                  >
                    {/* Main row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px' }}>
                      {/* Test ID */}
                      <span style={{ fontSize: 10.5, fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-tertiary)', flexShrink: 0, minWidth: 42 }}>
                        T-{String(idx + 100).padStart(3, '0')}
                      </span>

                      {/* Priority */}
                      <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, padding: '1px 5px', borderRadius: 4, background: `${PRIORITY_COLOR[row.testCase.priority]}18`, color: PRIORITY_COLOR[row.testCase.priority] }}>
                        {row.testCase.priority}
                      </span>

                      {/* Title */}
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.testCase.title}
                      </span>

                      {/* Auto badge */}
                      <AutoBadge status={rowAutoStatus} />

                      {/* Result buttons / status chip */}
                      {completed ? (
                        activeAction && (
                          <span style={{ fontSize: 11.5, fontWeight: 600, flexShrink: 0, color: activeAction.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {activeAction.icon} {activeAction.label}
                          </span>
                        )
                      ) : (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {ACTIONS.map((action) => {
                            const active = row.result === action.result
                            return (
                              <button
                                key={action.result}
                                onClick={(e) => { e.stopPropagation(); setResult(row.testCaseId, action.result) }}
                                disabled={saving === row.testCaseId}
                                style={{ height: 26, padding: '0 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: active ? action.bg : 'var(--surface-1)', border: `1px solid ${active ? action.border : 'var(--border)'}`, color: active ? action.color : 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.12s', letterSpacing: '0.01em' }}
                              >
                                <span style={{ fontSize: 12 }}>{action.icon}</span>{action.label}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {/* Report Bug button */}
                      {showReportBug && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setReportBugFor(row) }}
                          title="Report a bug from this failing test"
                          style={{ height: 26, padding: '0 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, letterSpacing: '0.01em' }}
                        >
                          🐛 Bug
                        </button>
                      )}
                    </div>

                    {/* Live step for active row */}
                    {isActiveRow && activeStep && (
                      <div style={{ padding: '0 16px 8px', paddingLeft: 68, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Spinner size={10} />
                        <span style={{ fontSize: 11.5, color: '#7c3aed', fontStyle: 'italic' }}>{activeStep}</span>
                      </div>
                    )}

                    {/* Inline note for manual FAIL/BLOCKED */}
                    {showNotes && (
                      <div style={{ padding: '0 16px 10px', paddingLeft: 68 }}>
                        <input
                          value={displayNotes}
                          onChange={e => handleNotesChange(row.testCaseId, e.target.value)}
                          placeholder="Add a note…"
                          onClick={e => e.stopPropagation()}
                          style={{ width: '100%', fontSize: 12, fontStyle: displayNotes ? 'italic' : 'normal', color: displayNotes ? '#dc2626' : 'var(--text-tertiary)', background: 'transparent', border: 'none', outline: 'none', padding: 0 }}
                        />
                      </div>
                    )}

                    {/* Read-only note for completed runs */}
                    {completed && row.notes && !hasEvidence && (
                      <div style={{ padding: '0 16px 8px', paddingLeft: 68 }}>
                        <span style={{ fontSize: 12, fontStyle: 'italic', color: '#dc2626' }}>{row.notes}</span>
                      </div>
                    )}

                    {/* Evidence toggle row */}
                    {(hasEvidence || (completed && row.notes)) && (
                      <div style={{ padding: '0 16px 8px', paddingLeft: 68, display: 'flex', alignItems: 'center', gap: 10 }}>
                        {hasEvidence && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpanded(row.testCaseId) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <span style={{ fontSize: 9, display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
                            {effectiveLog.length} step{effectiveLog.length !== 1 ? 's' : ''}
                            {effectiveScreenshot ? ', screenshot' : ''}
                          </button>
                        )}
                        {completed && row.notes && hasEvidence && (
                          <span style={{ fontSize: 11.5, fontStyle: 'italic', color: '#dc2626' }}>{row.notes}</span>
                        )}
                      </div>
                    )}

                    {/* Evidence panel */}
                    {isExpanded && hasEvidence && (
                      <EvidencePanel
                        log={effectiveLog}
                        screenshot={effectiveScreenshot}
                        onScreenshotClick={setFullscreenImg}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: live summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 16 }}>
            {/* Summary card */}
            <div className="card" style={{ padding: '18px 16px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 14, textTransform: 'uppercase' }}>
                Live Summary
              </p>
              <DonutChart pct={pct} done={done} total={total} />
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {LEGEND.filter(l => l.count > 0 || l.label === 'Not run').map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{l.label}</span>
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{l.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shortcuts card */}
            {!completed && (
              <div className="card" style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 10, textTransform: 'uppercase' }}>
                  Shortcuts
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {SHORTCUTS.map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{s.label}</span>
                      <kbd style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 5, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{s.key}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto Run hint card */}
            {!completed && !autoRunning && !autoSummary && counts.NOT_RUN > 0 && (
              <div className="card" style={{ padding: '14px 16px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Automation
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                  Let AI drive the browser and mark results for <strong>{counts.NOT_RUN}</strong> unrun case{counts.NOT_RUN !== 1 ? 's' : ''}.
                </p>
                <button onClick={() => setShowAutoModal(true)} style={{ width: '100%', height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <span>⚡</span> Auto Run
                </button>
              </div>
            )}

            {/* Failed tests quick-report card */}
            {counts.FAILED > 0 && (
              <div className="card" style={{ padding: '14px 16px', borderColor: 'rgba(220,38,38,0.2)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#dc2626', marginBottom: 8, textTransform: 'uppercase' }}>
                  🐛 {counts.FAILED} Failing
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                  Click <strong>🐛 Bug</strong> next to any failing test to instantly report it.
                </p>
                <button
                  onClick={() => {
                    const firstFailed = rows.find(r => r.result === 'FAILED')
                    if (firstFailed) setReportBugFor(firstFailed)
                  }}
                  style={{ width: '100%', height: 32, borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                >
                  🐛 Report first failure
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
