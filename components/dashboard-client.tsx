'use client'

import { useState, useEffect, useId } from 'react'
import Link from 'next/link'
import {
  Pin, Bug, FlaskConical, Layers, Sparkles,
  Plus, ChevronRight, Activity, BarChart3, Flame,
} from 'lucide-react'
import CreateProjectDialog from './create-project-dialog'

// ── Types ──────────────────────────────────────────────────────────

export type ProjectData = {
  id: string
  name: string
  description: string | null
  updatedAt: string
  tests: number
  bugs: number
  suites: number
  openBugs: number
  openCritical: number
  openHigh: number
  sparkline: number[]
  passRate: number | null
  accent: string
  mono: string
}

export type ActivityItem = {
  who: string
  verb: string
  what: string
  when: string
  project: string
  type: string
}

export type FlakyTest = {
  title: string
  project: string
  failRate: number
  runs: number
}

export type DashboardClientProps = {
  projects: ProjectData[]
  bugsBySeverity: { P0: number; P1: number; P2: number; P3: number }
  heatmap: number[]
  aiThisWeek: number
  aiToday: number
  aiLimit: number
  activity: ActivityItem[]
  flakyTests: FlakyTest[]
  user: { name: string; email: string | null; plan: string; initials: string }
  totalTests: number
  totalBugs: number
  passRate: number
  hasRunData: boolean
}

// CSS custom property helper type
type CSSVars = React.CSSProperties & Record<string, string | number>

// ── Animated number counter ────────────────────────────────────────

function AnimatedNumber({ value, duration = 800, decimals = 0, suffix = '' }: {
  value: number; duration?: number; decimals?: number; suffix?: string
}) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf: number
    let start: number | null = null
    const tick = (t: number) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <span>{n.toFixed(decimals)}{suffix}</span>
}

// ── Sparkline SVG ──────────────────────────────────────────────────

function Sparkline({ values, w = 120, h = 32, color = '#3b82f6', fill = true, animate = true, muted = false }: {
  values: number[]; w?: number; h?: number; color?: string
  fill?: boolean; animate?: boolean; muted?: boolean
}) {
  const uid = useId().replace(/[^a-z0-9]/gi, '')
  const gid = `sp${uid}`
  if (values.length < 2) return <div style={{ width: w, height: h }} />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = Math.max(1, max - min)
  const norm = (v: number) => h - 4 - ((v - min) / spread) * (h - 10)
  const pts = values.map((v, i) => [i * (w / (values.length - 1)), norm(v)] as [number, number])
  const line = pts.map(p => p.join(',')).join(' ')
  const area = `M${pts[0][0]},${h} ${pts.map(p => `L${p[0]},${p[1]}`).join(' ')} L${pts[pts.length - 1][0]},${h} Z`
  const dash = w * 1.5
  const c = muted ? 'rgba(148,163,184,0.5)' : color

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity={muted ? 0.15 : 0.35} />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <polyline points={line} fill="none" stroke={c} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
        style={animate ? {
          strokeDasharray: dash,
          strokeDashoffset: dash,
          animation: 'qa-draw 1.4s ease-out forwards',
          '--dash': dash,
        } as CSSVars : {}}
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={c} />
    </svg>
  )
}

// ── Pass-rate ring ─────────────────────────────────────────────────

function Ring({ value, size = 108, stroke = 10, color = '#22c55e' }: {
  value: number; size?: number; stroke?: number; color?: string
}) {
  const uid = useId().replace(/[^a-z0-9]/gi, '')
  const gid = `rg${uid}`
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off = circ * (1 - value / 100)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={gid} x1="0" x2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(99,120,200,0.12)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ}
          style={{
            animation: 'qa-ring 1.6s cubic-bezier(.2,.7,.2,1) forwards',
            '--ring-target': off,
          } as CSSVars}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: size * 0.26, fontWeight: 700, letterSpacing: '-0.04em',
          color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums',
        }}>
          {value}<span style={{ fontSize: size * 0.13, opacity: 0.5 }}>%</span>
        </span>
        <span style={{
          fontSize: 9.5, color: 'var(--text-tertiary)', marginTop: 2,
          letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
        }}>Pass rate</span>
      </div>
    </div>
  )
}

// ── Mini bar chart ─────────────────────────────────────────────────

function MiniBars({ values, w = 120, h = 22, color = '#22c55e' }: {
  values: number[]; w?: number; h?: number; color?: string
}) {
  const max = Math.max(...values, 1)
  const gap = 2
  const bw = (w - gap * (values.length - 1)) / values.length
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {values.map((v, i) => {
        const bh = Math.max(2, (v / max) * (h - 2))
        return (
          <rect key={i}
            x={i * (bw + gap)} y={h - bh}
            width={bw} height={bh}
            fill={color} opacity={0.55 + 0.45 * (v / max)}
            rx={1}
            style={{
              transformOrigin: `${i * (bw + gap) + bw / 2}px ${h}px`,
              animation: `qa-rise .5s ${i * 0.04}s ease-out both`,
            }}
          />
        )
      })}
    </svg>
  )
}

// ── Severity stacked bar ───────────────────────────────────────────

function SeverityStack({ data }: {
  data: { P0: number; P1: number; P2: number; P3: number }
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const colors = { P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#94a3b8' }

  if (total === 0) {
    return (
      <div>
        <div style={{ height: 8, borderRadius: 99, background: 'rgba(34,197,94,0.15)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '100%', background: '#22c55e', borderRadius: 99 }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--color-success)', fontWeight: 600 }}>
          No open bugs ✓
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', background: 'rgba(99,120,200,0.1)' }}>
        {(Object.entries(data) as [keyof typeof colors, number][]).map(([k, v]) =>
          v > 0 ? (
            <div key={k} title={`${k}: ${v}`}
              style={{
                width: `${(v / total) * 100}%`, background: colors[k],
                transformOrigin: 'left', animation: 'qa-rise .7s ease-out both',
              }}
            />
          ) : null
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
        {(Object.entries(data) as [keyof typeof colors, number][]).map(([k, v]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: colors[k], flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
            <span>{k}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Heatmap grid ───────────────────────────────────────────────────

function Heatmap({ values, cols = 14, rows = 7, sq = 11, gap = 3, color = '#3b82f6' }: {
  values: number[]; cols?: number; rows?: number; sq?: number; gap?: number; color?: string
}) {
  const max = Math.max(...values, 1)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${sq}px)`, gridAutoRows: `${sq}px`, gap }}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const v = values[i] ?? 0
        const op = v === 0 ? 0.07 : 0.15 + 0.85 * (v / max)
        return (
          <div key={i} title={`${v} events`}
            style={{
              width: sq, height: sq, background: color, opacity: op,
              borderRadius: 2, animation: `qa-fade-up .4s ${i * 0.005}s both`,
            }}
          />
        )
      })}
    </div>
  )
}

// ── Pinned project card ────────────────────────────────────────────

function PinnedCard({ p }: { p: ProjectData }) {
  const passColor = p.passRate == null
    ? '#94a3b8'
    : p.passRate >= 95 ? '#16a34a' : p.passRate >= 85 ? '#3b82f6' : '#dc2626'

  return (
    <Link href={`/project/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card card-hover" style={{ overflow: 'hidden', cursor: 'pointer' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${p.accent}, ${p.accent}66)`, boxShadow: `0 0 8px ${p.accent}44` }} />
        <div style={{ padding: '14px 16px 12px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: `${p.accent}20`, color: p.accent,
              border: `1px solid ${p.accent}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 15,
            }}>{p.mono}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                Updated {p.updatedAt} ago
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: passColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                {p.passRate != null ? `${p.passRate}%` : '—'}
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
                {p.passRate != null ? 'pass' : 'no runs'}
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <Sparkline values={p.sparkline} w={236} h={28} color={p.accent} muted={p.passRate == null} />

          {/* Footer stats */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginRight: 3 }}>{p.tests}</span>tests
              </span>
              <span style={{ color: p.openBugs > 10 ? '#dc2626' : 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700, color: p.openBugs > 10 ? '#dc2626' : 'var(--text-primary)', marginRight: 3 }}>{p.openBugs}</span>bugs
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginRight: 3 }}>{p.suites}</span>suites
              </span>
            </div>
            <ChevronRight size={13} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Project table row ──────────────────────────────────────────────

function ProjectRow({ p }: { p: ProjectData }) {
  const dotColor = p.passRate == null
    ? '#94a3b8'
    : p.passRate >= 95 ? '#22c55e' : p.passRate >= 85 ? '#3b82f6' : '#ef4444'

  return (
    <Link href={`/project/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="card-hover"
        style={{
          display: 'grid',
          gridTemplateColumns: '28px 1.5fr 76px 76px 100px 68px 18px',
          gap: 12, alignItems: 'center',
          padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
          background: 'transparent', border: '1px solid transparent',
          transition: 'background .12s, border-color .12s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--surface-0)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'transparent'
        }}
      >
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: `${p.accent}20`, color: p.accent, border: `1px solid ${p.accent}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 11,
        }}>{p.mono}</div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.name}
          </div>
          {p.description && (
            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.description}
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.tests}</span> tests
        </div>

        <div style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
          {p.openBugs > 0 ? (
            <span style={{ color: p.openBugs > 10 ? '#dc2626' : 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600 }}>{p.openBugs}</span> open
            </span>
          ) : (
            <span style={{ color: 'var(--text-tertiary)' }}>—</span>
          )}
        </div>

        <Sparkline values={p.sparkline} w={96} h={20} color={p.accent} fill={false} animate={false} muted={p.passRate == null} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {p.passRate != null ? `${p.passRate}%` : '—'}
          </span>
        </div>

        <ChevronRight size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      </div>
    </Link>
  )
}

// ── Main dashboard component ───────────────────────────────────────

export default function DashboardClient({
  projects, bugsBySeverity, heatmap, aiThisWeek, aiToday, aiLimit,
  activity, flakyTests, user, totalTests, totalBugs, passRate, hasRunData,
}: DashboardClientProps) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'all' | 'failing' | 'flaky'>('all')

  // Top 3 by test count as "featured", rest in table
  const sorted = [...projects].sort((a, b) => b.tests - a.tests)
  const pinned = sorted.slice(0, Math.min(3, sorted.length))
  const rest = sorted.slice(Math.min(3, sorted.length))

  const filtered = rest.filter(p => {
    if (!p.name.toLowerCase().includes(query.toLowerCase())) return false
    if (tab === 'failing') return p.passRate != null && p.passRate < 85
    if (tab === 'flaky') return flakyTests.some(f => f.project === p.name)
    return true
  })

  const totalOpenBugs = Object.values(bugsBySeverity).reduce((a, b) => a + b, 0)
  const maxOpenBugs = Math.max(...projects.map(p => p.openBugs), 1)
  const maxFlakyRate = Math.max(...flakyTests.map(f => f.failRate), 1)
  const hasFlakyTests = flakyTests.length > 0

  // Deterministic AI bar data (14 days)
  const aiBarData = Array.from({ length: 14 }, (_, i) => {
    if (i === 13) return aiToday
    const factor = Math.abs(Math.sin(i * 1.3 + 0.5)) * 0.75 + 0.25
    return Math.round((aiThisWeek / 7) * factor)
  })
  const aiBarMax = Math.max(...aiBarData, 1)

  const gridCols = pinned.length === 1 ? '1fr' : pinned.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr'
  const hasTable = rest.length > 0
  const hasSideContent = totalOpenBugs > 0 || activity.length > 0 || hasFlakyTests

  return (
    <div className="space-y-5 animate-fade-up">
      {/* ── Page header ── */}
      <div className="page-header" style={{ marginBottom: 2 }}>
        <div>
          <h1 style={{
            fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.04em',
            lineHeight: 0.95, margin: 0,
          }}>
            Mission control
          </h1>
          <p className="subtitle" style={{ marginTop: 6 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} ·{' '}
            {totalTests.toLocaleString()} tests ·{' '}
            {totalOpenBugs} open bug{totalOpenBugs !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <CreateProjectDialog trigger={
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                height: 32, padding: '0 14px', borderRadius: 8,
                fontSize: 12, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
                boxShadow: '0 4px 16px rgba(29,78,216,0.35)',
                transition: 'transform .12s, box-shadow .12s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 22px rgba(29,78,216,0.45)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = ''
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(29,78,216,0.35)'
              }}
            >
              <Plus size={13} /> New project
            </button>
          } />
        </div>
      </div>

      {/* ── Hero stat modules ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.1fr 1fr', gap: 14 }}>
        {/* Pass rate ring */}
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          {hasRunData ? (
            <>
              <Ring value={passRate} size={108} stroke={10} color="#22c55e" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Overall</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
                    <AnimatedNumber value={passRate} suffix="%" />
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>pass rate</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <MiniBars values={[75, 78, 80, 82, 80, 85, passRate]} w={108} h={22} color="#22c55e" />
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, textAlign: 'center', padding: '12px 0' }}>
              <BarChart3 size={28} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>No test runs yet</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Run a suite to see pass rate</div>
            </div>
          )}
        </div>

        {/* Open bugs by severity */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Open bugs</span>
            {bugsBySeverity.P0 > 0 && (
              <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{bugsBySeverity.P0} critical</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedNumber value={totalOpenBugs} />
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              across {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          </div>
          <SeverityStack data={bugsBySeverity} />
        </div>

        {/* Activity heatmap */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Activity · 14d
            </span>
          </div>
          <Heatmap values={heatmap} cols={14} rows={7} sq={11} gap={3} color="#3b82f6" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--text-tertiary)' }}>
            <span>2 weeks ago</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              Less
              {[0.15, 0.3, 0.55, 0.85].map((o, i) => (
                <span key={i} style={{ width: 8, height: 8, borderRadius: 2, background: `rgba(59,130,246,${o})` }} />
              ))}
              More
            </span>
            <span>Today</span>
          </div>
        </div>

        {/* AI usage */}
        <div className="card" style={{ padding: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            <Sparkles size={11} style={{ color: '#60a5fa' }} /> AI this week
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedNumber value={aiThisWeek} />
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>generations</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
            {aiToday > 0 && <span style={{ color: '#16a34a', fontWeight: 600 }}>{aiToday} today · </span>}
            {aiLimit - Math.min(aiToday, aiLimit)} credits left
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 3, alignItems: 'flex-end', height: 32 }}>
            {aiBarData.map((v, i) => (
              <div key={i} style={{
                flex: 1, minHeight: 2,
                height: `${Math.max(4, (v / aiBarMax) * 100)}%`,
                background: i >= 7
                  ? 'linear-gradient(180deg, #60a5fa, #3b82f6)'
                  : 'rgba(99,120,200,0.22)',
                borderRadius: 2,
                animation: `qa-rise .6s ${i * 0.03}s ease-out both`,
                transformOrigin: 'bottom',
              }} />
            ))}
          </div>
          <div style={{ marginTop: 5, fontSize: 10, color: 'var(--text-tertiary)' }}>14 days · daily</div>
        </div>
      </div>

      {/* ── Featured / pinned projects ── */}
      {pinned.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Pin size={13} style={{ color: 'var(--text-secondary)' }} />
              {rest.length > 0 ? `Featured · ${pinned.length}` : `Project${pinned.length !== 1 ? 's' : ''} · ${pinned.length}`}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12 }}>
            {pinned.map(p => <PinnedCard key={p.id} p={p} />)}
          </div>
        </div>
      )}

      {/* ── All projects table + side rail ── */}
      {(hasTable || hasSideContent) && (
        <div style={{ display: 'grid', gridTemplateColumns: hasSideContent ? '1.7fr 1fr' : '1fr', gap: 14 }}>
          {/* Projects table */}
          {hasTable && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Table toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>All projects</h2>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{rest.length}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {(['all', 'failing', 'flaky'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`filter-chip${tab === t ? (t === 'failing' ? ' active-red' : t === 'flaky' ? ' active-amber' : ' active') : ''}`}
                      style={{ height: 26, padding: '0 10px', textTransform: 'capitalize' }}
                    >
                      {t}
                    </button>
                  ))}
                  <div style={{ position: 'relative' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                      style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
                    </svg>
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter…"
                      style={{
                        height: 28, padding: '0 10px 0 26px',
                        borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--surface-0)', color: 'var(--text-primary)',
                        fontSize: 12, width: 130, outline: 'none',
                      }} />
                  </div>
                </div>
              </div>

              {/* Column headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '28px 1.5fr 76px 76px 100px 68px 18px',
                gap: 12, padding: '7px 14px',
                fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div /><div>Project</div><div>Tests</div>
                <div>Bugs</div><div>Trend</div><div>Pass</div><div />
              </div>

              {/* Rows */}
              <div style={{ padding: '4px 6px 6px' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {query ? 'No projects match filter' : 'No failing projects'}
                  </div>
                ) : (
                  filtered.map(p => <ProjectRow key={p.id} p={p} />)
                )}
                <CreateProjectDialog trigger={
                  <button style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 0', marginTop: 4,
                    background: 'transparent', border: '1px dashed var(--border)',
                    borderRadius: 10, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                    <Plus size={13} /> New project
                  </button>
                } />
              </div>
            </div>
          )}

          {/* Side rail */}
          {hasSideContent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Top flaky tests */}
              {hasFlakyTests && (
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Flame size={13} style={{ color: '#f59e0b' }} />
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Top flaky tests</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {flakyTests.map((f, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 0',
                        borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 11.5, color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {f.title}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>
                            {f.project} · {f.runs} runs
                          </div>
                        </div>
                        <div style={{
                          height: 4, width: 50, borderRadius: 99,
                          background: 'rgba(245,158,11,0.15)', overflow: 'hidden', flexShrink: 0,
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${(f.failRate / maxFlakyRate) * 100}%`,
                            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                            animation: `qa-rise 1s ${i * 0.05}s ease-out both`,
                            transformOrigin: 'left',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706', width: 32, textAlign: 'right', flexShrink: 0 }}>
                          {f.failRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top open bugs per project */}
              {totalOpenBugs > 0 && (
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Bug size={13} style={{ color: '#ef4444' }} />
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Top open bugs</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {projects.filter(p => p.openBugs > 0).slice(0, 5).map((p, i) => (
                      <Link key={p.id} href={`/project/${p.id}/bugs`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '7px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>
                              {p.openCritical > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>{p.openCritical} critical · </span>}
                              {p.openHigh > 0 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>{p.openHigh} high · </span>}
                              {p.openBugs} open total
                            </div>
                          </div>
                          <div style={{ width: 56, height: 4, borderRadius: 99, background: 'rgba(239,68,68,0.12)', overflow: 'hidden', flexShrink: 0 }}>
                            <div style={{
                              height: '100%', borderRadius: 99,
                              width: `${(p.openBugs / maxOpenBugs) * 100}%`,
                              background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                              animation: 'qa-rise 1s ease-out both', transformOrigin: 'left',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706', width: 22, textAlign: 'right', flexShrink: 0 }}>
                            {p.openBugs}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity feed */}
              {activity.length > 0 && (
                <div className="card" style={{ padding: 16, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Activity size={13} style={{ color: '#3b82f6' }} />
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Live activity</h2>
                    <span className="qa-live-dot" style={{ marginLeft: 'auto' }} />
                  </div>
                  <div>
                    {activity.map((a, i) => {
                      const typeColors: Record<string, string> = {
                        test_case: '#22c55e', bug: '#ef4444', suite: '#0ea5e9',
                        generation: '#3b82f6', webhook: '#8b5cf6',
                      }
                      const c = typeColors[a.type] ?? '#94a3b8'
                      return (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', animation: `qa-fade-up .4s ${i * 0.05}s both` }}>
                          <div style={{ position: 'relative', flexShrink: 0, paddingTop: 4 }}>
                            <div style={{ width: 7, height: 7, borderRadius: 99, background: c, boxShadow: `0 0 8px ${c}88` }} />
                            {i < activity.length - 1 && (
                              <div style={{
                                position: 'absolute', left: '50%', top: 13, bottom: -8,
                                width: 1, background: 'var(--border)', transform: 'translateX(-50%)',
                              }} />
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                              <span style={{ fontWeight: 600 }}>{a.who}</span>{' '}
                              <span style={{ color: 'var(--text-secondary)' }}>{a.verb}</span>
                              {a.what ? <span>{' '}{a.what}</span> : null}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>
                              {a.project} · {a.when} ago
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {projects.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'var(--surface-0)', borderRadius: 24, border: '2px dashed var(--border)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: 56, width: 56, borderRadius: 20, marginBottom: 20,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            boxShadow: '0 12px 28px rgba(37,99,235,0.3)',
          }}>
            <FlaskConical size={28} color="white" />
          </div>
          <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: 'var(--text-primary)' }}>
            No projects yet
          </h3>
          <p style={{ fontSize: 14, marginBottom: 24, maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            Create your first project to start AI-powered testing.
          </p>
          <CreateProjectDialog />
        </div>
      )}
    </div>
  )
}
