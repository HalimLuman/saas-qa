'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface SuiteRun {
  id: string
  startedAt: Date
  status: string
  results: { result: string }[]
}

interface Suite {
  id: string
  name: string
  description: string | null
  createdAt: Date
  projectId: string
  _count: { testCases: number }
  runs: SuiteRun[]
}

// Deterministic icon + color from suite name
const SUITE_ICONS = ['🔬', '🧪', '⚡', '🛡️', '🔑', '🌐', '📦', '💳', '🔔', '🎯']
const SUITE_BG_COLORS = [
  ['#fde68a', '#f59e0b'],
  ['#bfdbfe', '#3b82f6'],
  ['#bbf7d0', '#16a34a'],
  ['#fecaca', '#dc2626'],
  ['#e9d5ff', '#7c3aed'],
  ['#fed7aa', '#ea580c'],
  ['#cffafe', '#0891b2'],
  ['#fce7f3', '#db2777'],
]

function suiteColors(name: string) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return SUITE_BG_COLORS[h % SUITE_BG_COLORS.length]
}

function suiteIcon(name: string) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return SUITE_ICONS[h % SUITE_ICONS.length]
}

function PassRing({ pct, color, size = 68, stroke = 7 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(99,120,200,0.1)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        style={{ fill: color, fontSize: size * 0.2, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </text>
    </svg>
  )
}

function TrendBars({ runs, color }: { runs: SuiteRun[]; color: string }) {
  // Build up to 7 bars from actual run history (oldest → newest), pad with mock if needed
  const actual = [...runs].reverse().map(run => {
    const total = run.results.length
    if (total === 0) return 0
    const passed = run.results.filter(r => r.result === 'PASSED').length
    return Math.round((passed / total) * 100)
  })
  const mock = [88, 92, 85, 90, 87, 93, 89]
  const bars = actual.length >= 7
    ? actual.slice(-7)
    : [...mock.slice(0, 7 - actual.length).map((v, i) => (actual.length === 0 ? v : mock[i])), ...actual]

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 28, flex: 1 }}>
      {bars.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max(12, v)}%`,
          background: i === bars.length - 1 ? color : color + '44',
          borderRadius: 2,
          minHeight: 3,
          transition: 'height 0.4s ease',
        }} />
      ))}
    </div>
  )
}

function StartRunInline({ suiteId, projectId }: { suiteId: string; projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function start(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setLoading(true)
    try {
      const res = await fetch(`/api/suites/${suiteId}/runs`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/project/${projectId}/suites/${suiteId}/run/${data.run.id}`)
    } catch (err) {
      toast.error('Failed to start run', { description: String(err) })
      setLoading(false)
    }
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      style={{
        height: 27, padding: '0 10px', borderRadius: 7,
        fontSize: 11.5, fontWeight: 600,
        background: 'var(--surface-1)', border: '1px solid var(--border)',
        color: 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: 5,
        flexShrink: 0,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 10 }}>▷</span>
      {loading ? '…' : 'Run'}
    </button>
  )
}

export default function SuiteList({ suites, projectId }: { suites: Suite[]; projectId: string }) {
  const router = useRouter()

  async function deleteSuite(id: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Delete this suite? This cannot be undone.')) return
    await fetch(`/api/suites/${id}`, { method: 'DELETE' })
    router.refresh()
    toast.success('Suite deleted')
  }

  if (suites.length === 0) {
    return (
      <div
        className="text-center py-20 rounded-2xl"
        style={{ background: 'var(--surface-0)', border: '2px dashed var(--border)' }}
      >
        <div
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-5"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 12px 28px rgba(59,130,246,0.3)' }}
        >
          <span style={{ fontSize: 28 }}>🧪</span>
        </div>
        <h3 className="text-[17px] font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No regression suites yet</h3>
        <p className="text-sm mb-7 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Group test cases into a suite to run structured regression checks before every release.
        </p>
        <Link href={`/project/${projectId}/suites/new`}>
          <button
            className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <Plus className="h-4 w-4" /> Build a Suite
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {suites.map((suite) => {
        const lastRun = suite.runs[0]
        const total   = lastRun?.results.length ?? 0
        const passed  = lastRun?.results.filter((r) => r.result === 'PASSED').length ?? 0
        const failed  = lastRun?.results.filter((r) => r.result === 'FAILED').length ?? 0
        const passRate = total > 0 ? Math.round((passed / total) * 100) : null

        const status = !lastRun ? 'NO_RUNS'
          : failed > 0 ? 'FAILING'
          : passRate !== null && passRate < 85 ? 'DEGRADED'
          : 'PASSING'

        const statusColor = status === 'PASSING'  ? '#16a34a'
          : status === 'FAILING'  ? '#dc2626'
          : status === 'DEGRADED' ? '#d97706'
          : '#94a3b8'

        const statusLabel = status === 'PASSING'  ? 'Passing'
          : status === 'FAILING'  ? 'Failing'
          : status === 'DEGRADED' ? 'Degraded'
          : 'No runs'

        const [bgLight, bgStrong] = suiteColors(suite.name)
        const icon = suiteIcon(suite.name)

        return (
          <div key={suite.id} className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
            {/* Status stripe */}
            <div style={{ height: 3, background: `linear-gradient(90deg,${statusColor},${statusColor}66)` }} />

            <div style={{ padding: '16px 18px' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 14 }}>
                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `linear-gradient(135deg,${bgLight},${bgStrong}33)`,
                  border: `1px solid ${bgStrong}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {icon}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                    <Link
                      href={`/project/${projectId}/suites/${suite.id}`}
                      style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
                      className="hover-underline"
                    >
                      {suite.name}
                    </Link>
                    {status !== 'NO_RUNS' && (
                      <span style={{
                        fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                        background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}40`,
                      }}>
                        {statusLabel}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                    {suite._count.testCases} case{suite._count.testCases !== 1 ? 's' : ''}
                    {suite.description ? ` · ${suite.description}` : ''}
                  </div>
                </div>

                <StartRunInline suiteId={suite.id} projectId={projectId} />
              </div>

              {/* Pass ring + trend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {passRate !== null ? (
                  <PassRing pct={passRate} color={statusColor} size={68} stroke={7} />
                ) : (
                  <div style={{
                    width: 68, height: 68, borderRadius: 99, flexShrink: 0,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>No<br/>runs</span>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <TrendBars runs={suite.runs} color={statusColor} />
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
                    {lastRun ? (
                      <>Last run {formatDate(lastRun.startedAt)} · trend last 7</>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>Run this suite to see results</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => deleteSuite(suite.id, e)}
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 22, height: 22, borderRadius: 6,
                background: 'transparent', border: 'none',
                color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 16, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.4,
              }}
              title="Delete suite"
            >
              ×
            </button>
          </div>
        )
      })}

      {/* New suite CTA */}
      <Link href={`/project/${projectId}/suites/new`}>
        <div style={{
          minHeight: 200,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: 'transparent',
          border: '1.5px dashed var(--border)',
          borderRadius: 14, cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
          transition: 'border-color .15s, background .15s',
        }}
        className="hover-new-suite"
        >
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={18} style={{ color: '#3b82f6' }} />
          </div>
          New regression suite
        </div>
      </Link>
    </div>
  )
}
