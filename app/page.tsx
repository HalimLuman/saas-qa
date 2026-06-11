import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing-nav'
import { MarketingFooter } from '@/components/marketing-footer'

const MONO = "'JetBrains Mono', 'Fira Code', ui-monospace, monospace"

// ─── Design tokens (light theme) ─────────────────────────────────────────────
const C = {
  surface0: '#ffffff',
  surface2: '#f8faff',
  border: 'rgba(99,120,200,0.14)',
  borderSubtle: 'rgba(99,120,200,0.1)',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#94a3b8',
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
  brand700: '#2563eb',
  navyBg: 'linear-gradient(180deg, #f8faff 0%, #f1f5ff 45%, #eef2ff 100%)',
  pageBg: '#ffffff',
}
const THEME = {
  bg: '#ffffff',
  surface: '#f8fafc',
  surfaceMuted: '#f1f5f9',
  border: 'rgba(99,120,200,0.1)',
  borderHighlight: 'rgba(59,130,246,0.06)',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  accent: '#2563eb',
  accentGlow: 'rgba(37,99,235,0.06)',
};

// ─── Dashboard mockup keeps its own dark palette ──────────────────────────────
const MOCKUP = {
  bg: '#030712',
  surface: '#0b1329',
  surfaceMuted: '#0f172a',
  border: 'rgba(255, 255, 255, 0.06)',
  borderHighlight: 'rgba(59, 130, 246, 0.2)',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  accent: '#3b82f6',
  accentGlow: 'rgba(59, 130, 246, 0.15)',
};

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

// --- DATA MOCKS ---
const SIDEBAR_ITEMS = [
  { label: 'Overview', icon: '⚡', active: true },
  { label: 'Test Suites', icon: '📂' },
  { label: 'AI Generation Lab', icon: '✨' },
  { label: 'Bug Tracker', icon: '🐛' },
  { label: 'CI/CD Pipelines', icon: '🚀' },
  { label: 'Analytics', icon: '📊' },
];

const STATS = [
  { label: 'Active Coverage', value: '98.2%', trend: '+2.4%', positive: true },
  { label: 'AI Cases Generated', value: '12,480', trend: '+1.2k', positive: true },
  { label: 'Unresolved Bugs', value: '14', trend: '-8', positive: false },
  { label: 'Avg Execution Time', value: '1m 42s', trend: '-18s', positive: false },
];

const RECENT_TESTS = [
  { id: 'run-902', name: 'Stripe Checkout Pipeline', duration: '2m 15s', status: 'success', coverage: '100%' },
  { id: 'run-901', name: 'OAuth2.0 Passwordless Flow', duration: '45s', status: 'success', coverage: '94%' },
  { id: 'run-900', name: 'GraphQL Mesh Gateway', duration: '4m 12s', status: 'failed', coverage: '81%' },
];

// ─── Inline SVGs ─────────────────────────────────────────────────────────────
function IconAI({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.7L4 10.6l4.5 4-1.1 6.2 5.6-3.2 5.6 3.2-1.1-6.2 4.5-4-6.1-1.9z" />
    </svg>
  )
}
function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function IconCalendar({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v3M16 2v3M3 8h18M5 5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  )
}
function IconClock({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" />
    </svg>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Wrap({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <div style={{ maxWidth: narrow ? 820 : 1240, margin: '0 auto', padding: '0 28px' }}>
      {children}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default async function LandingPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div style={{ background: C.pageBg, minHeight: '100vh', color: C.textPrimary, fontFamily: 'Inter, -apple-system, sans-serif' }}>
      {/* Ambient background orbs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }} aria-hidden="true">
        <div style={{ position: 'absolute', top: '-10%', right: '-6%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-8%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 65%)' }} />
      </div>
      <MarketingNav variant="light" />

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        background: THEME.bg,
        color: THEME.textPrimary,
        padding: '120px 24px 96px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        {/* Dynamic Ambient Background Glows */}
        <div style={{ position: 'absolute', top: -200, left: '50%', transform: 'translateX(-50%)', width: 1000, height: 400, background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.07), transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, right: '10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(147,51,234,0.03), transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

        {/* --- HERO MARKETING COPY --- */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: 80 }}>

          {/* Dynamic Typography Header */}
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 68px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            margin: '0 0 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Ship custom features.<br />Leave the breakage behind.
          </h1>

          {/* Refined Subtitle */}
          <p style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            lineHeight: 1.6,
            color: THEME.textSecondary,
            margin: '0 auto 40px',
            maxWidth: '54ch'
          }}>
            softAssert maps your application layout natively, auto-generates deep diagnostic test suites, and eliminates spreadsheet dependencies entirely.
          </p>

          {/* CTA Dashboard Group */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <a href="/register" style={{
              height: 48,
              padding: '0 28px',
              borderRadius: 8,
              background: THEME.accent,
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: '0 4px 24px rgba(37, 99, 235, 0.35)',
              transition: 'transform 0.2s'
            }}>
              Deploy Free Workspace
            </a>

            <a href="/features" style={{
              height: 48,
              padding: '0 24px',
              borderRadius: 8,
              background: 'transparent',
              color: THEME.textPrimary,
              fontWeight: 500,
              fontSize: 14,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: `1px solid rgba(99,120,200,0.25)`,
            }}>
              Watch Interactive Demo <span style={{ color: THEME.textSecondary }}>→</span>
            </a>
          </div>

          <p style={{ fontSize: 12, color: THEME.textMuted, fontFamily: MONO_FONT }}>
            Free tier includes up to 3 seats • Zero configuration required
          </p>
        </div>

        {/* --- DASHBOARD MOCKUP PREVIEW --- */}
        <div style={{
          maxWidth: '1140px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
          borderRadius: 16,
          border: `1px solid rgba(99,120,200,0.14)`,
          background: MOCKUP.surface,
          boxShadow: '0 40px 120px -20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)',
          overflow: 'hidden'
        }}>

          {/* OS Browser Bar */}
          <div style={{
            padding: '12px 20px',
            background: MOCKUP.surfaceMuted,
            borderBottom: `1px solid ${MOCKUP.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: 8, width: 60 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', opacity: 0.8 }} />
            </div>

            <div style={{
              width: 440,
              height: 28,
              borderRadius: 6,
              background: 'rgba(0,0,0,0.2)',
              border: `1px solid ${MOCKUP.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}>
              <span style={{ color: MOCKUP.textMuted, fontSize: 11 }}>🔒</span>
              <span style={{ fontFamily: MONO_FONT, fontSize: 11, color: MOCKUP.textSecondary, letterSpacing: '0.02em' }}>
                softassert.io/acme-robotics/workspace
              </span>
            </div>

            <div style={{ width: 60, display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 12, color: MOCKUP.textMuted }}>⚙️</span>
            </div>
          </div>

          {/* Main Interface Split */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 520 }}>

            {/* Side Navigation Block */}
            <aside style={{ background: MOCKUP.surfaceMuted, borderRight: `1px solid ${MOCKUP.border}`, padding: '24px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px 20px', borderBottom: `1px solid ${MOCKUP.border}`, marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${MOCKUP.accent}, #1d4ed8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>Ω</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: MOCKUP.textPrimary }}>Acme Robotics</div>
                  <div style={{ fontSize: 10, color: MOCKUP.textMuted, fontFamily: MONO_FONT }}>Enterprise Hub</div>
                </div>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {SIDEBAR_ITEMS.map((item) => (
                  <div key={item.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: item.active ? 600 : 400,
                    color: item.active ? MOCKUP.textPrimary : MOCKUP.textSecondary,
                    background: item.active ? MOCKUP.borderHighlight : 'transparent',
                    border: item.active ? `1px solid rgba(59,130,246,0.15)` : '1px solid transparent',
                    cursor: 'pointer'
                  }}>
                    <span style={{ fontSize: 14, opacity: item.active ? 1 : 0.6 }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </nav>
            </aside>

            {/* Central Workspace Dashboard */}
            <main style={{ padding: '32px', overflowY: 'auto', background: MOCKUP.surface }}>

              {/* Context Header Area */}
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: MOCKUP.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>System Analytics Overview</h2>
                  <p style={{ fontSize: 12, color: MOCKUP.textSecondary, marginTop: 4 }}>Production Deployment Monitoring • Branch: <span style={{ fontFamily: MONO_FONT, color: MOCKUP.accent }}>main</span></p>
                </div>

                <button style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 6,
                  background: MOCKUP.borderHighlight,
                  border: `1px solid rgba(59, 130, 246, 0.3)`,
                  color: '#93c5fd',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}>
                  <span>✨</span> Run Autonomous Suite
                </button>
              </header>

              {/* Asymmetrical Matrix Grid Cards */}
              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                {STATS.map((stat) => (
                  <div key={stat.label} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${MOCKUP.border}`,
                    borderRadius: 12,
                    padding: '16px 20px',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)'
                  }}>
                    <div style={{ fontSize: 11, color: MOCKUP.textSecondary, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{stat.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontSize: 24, fontWeight: 700, color: MOCKUP.textPrimary, letterSpacing: '-0.03em' }}>{stat.value}</span>
                      <span style={{
                        fontSize: 11,
                        fontFamily: MONO_FONT,
                        fontWeight: 600,
                        color: stat.positive ? '#10b981' : '#f43f5e'
                      }}>
                        {stat.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </section>

              {/* High-Fidelity Data Architecture Grid */}
              <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>

                {/* Dynamic Execution Stream */}
                <div style={{ background: 'rgba(0,0,0,0.15)', border: `1px solid ${MOCKUP.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${MOCKUP.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: MOCKUP.textSecondary }}>RECENT RUN EXECUTIONS</span>
                    <span style={{ fontSize: 11, fontFamily: MONO_FONT, color: MOCKUP.textMuted }}>实时更新</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {RECENT_TESTS.map((run, i) => (
                      <div key={run.id} style={{
                        padding: '14px 20px',
                        borderBottom: i < RECENT_TESTS.length - 1 ? `1px solid ${MOCKUP.border}` : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: run.status === 'failed' ? 'rgba(244,63,94,0.02)' : 'transparent'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: run.status === 'success' ? '#10b981' : '#f43f5e',
                            boxShadow: run.status === 'success' ? '0 0 8px #10b981' : '0 0 8px #f43f5e'
                          }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: MOCKUP.textPrimary, fontFamily: MONO_FONT }}>{run.name}</div>
                            <div style={{ fontSize: 11, color: MOCKUP.textMuted, marginTop: 2 }}>Build Registry ID: {run.id}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span style={{ fontSize: 11, fontFamily: MONO_FONT, color: MOCKUP.textSecondary }}>{run.duration}</span>
                          <span style={{
                            fontSize: 11,
                            fontFamily: MONO_FONT,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: run.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                            color: run.status === 'success' ? '#10b981' : '#f43f5e',
                            border: `1px solid ${run.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`
                          }}>
                            {run.coverage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Smart Failure Insights Widget */}
                <div style={{ background: 'rgba(0,0,0,0.15)', border: `1px solid ${MOCKUP.border}`, borderRadius: 12, padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ color: '#f59e0b', fontSize: 14 }}>⚠️</span>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: MOCKUP.textSecondary }}>CRITICAL TELEMETRY FAULTS</span>
                  </div>

                  <div style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '14px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: MONO_FONT, fontWeight: 700, color: '#f59e0b' }}>
                      <span>ERROR STATUS_502</span>
                      <span>P0</span>
                    </div>
                    <p style={{ fontSize: 12, color: MOCKUP.textSecondary, margin: '6px 0 0', lineHeight: 1.4 }}>
                      GraphQL gateway cluster mismatch detected inside regional Edge routing pools.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 8, padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: MONO_FONT, fontWeight: 700, color: '#f43f5e' }}>
                      <span>STALE DOM RESOURCE</span>
                      <span>P1</span>
                    </div>
                    <p style={{ fontSize: 12, color: MOCKUP.textSecondary, margin: '6px 0 0', lineHeight: 1.4 }}>
                      Interactive multi-currency payment frames failing state synchronization hooks.
                    </p>
                  </div>
                </div>

              </section>
            </main>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          LOGOS BAND
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '56px 0', borderTop: `1px solid ${C.borderSubtle}`, borderBottom: `1px solid ${C.borderSubtle}` }}>
        <Wrap>
          <p style={{ textAlign: 'center', fontSize: 13, color: C.textTertiary, margin: '0 0 28px' }}>
            Trusted by QA teams at engineering organizations of every size
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 32, alignItems: 'center', opacity: 0.85 }}>
            {['Acme Robotics', 'Northwind', 'Pixel Studio', 'Linear', 'Vercel', 'Stripe'].map((name) => (
              <div key={name} style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.012em', color: C.textSecondary, textAlign: 'center' }}>{name}</div>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURE TRIO
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '96px 0' }}>
        <Wrap>
          <div style={{ marginBottom: 44, maxWidth: 680 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: C.brand700, textTransform: 'uppercase' as const, display: 'inline-block', marginBottom: 12 }}>Why softAssert</span>
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.024em', margin: '0 0 12px', lineHeight: 1.08, color: C.textPrimary }}>Stop juggling four tools for one job.</h2>
            <p style={{ fontSize: 17, color: C.textSecondary, margin: 0 }}>
              softAssert consolidates the QA stack — test management, bug tracking, and execution — and adds an AI co-pilot that does the unglamorous half of the work.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { icon: <IconAI size={18} />, title: 'AI Studio', desc: 'Generate test cases from a PRD, a Figma frame, or an OpenAPI spec. Edit, accept, run — all without leaving the workspace.' },
              { icon: <IconCalendar size={18} />, title: 'Suites & runs', desc: 'Build smoke, regression, and release suites with drag-to-reorder. Schedule, trigger via webhook, or run on every PR.' },
              { icon: <IconClock size={18} />, title: 'Bug tracking', desc: 'P0–P3 severity, repro steps, screenshots, video. Link bugs back to test cases so a fixed case stays fixed.' },
            ].map((f) => (
              <div key={f.title} style={{
                background: '#ffffff',
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 28,
                boxShadow: '0 2px 16px rgba(99,120,200,0.07)',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.brand700, marginBottom: 18 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 18, margin: '0 0 6px', fontWeight: 700, letterSpacing: '-0.012em', color: C.textPrimary }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, maxWidth: '36ch' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TWO-UP: AI STUDIO
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '0 0 96px' }}>
        <Wrap>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 64, alignItems: 'center' }}>
            {/* Text */}
            <div>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: C.brand700, textTransform: 'uppercase' as const }}>01 · AI Studio</span>
              <h3 style={{ fontSize: 32, letterSpacing: '-0.022em', margin: '12px 0 12px', lineHeight: 1.1, maxWidth: '18ch', color: C.textPrimary }}>Test cases written in seconds, edited in minutes.</h3>
              <p style={{ color: C.textSecondary, fontSize: 16, maxWidth: '44ch', marginBottom: 20 }}>
                Paste a PRD, drop a Figma frame, or point us at an OpenAPI spec. Get back structured, named test cases — not paragraphs of prose.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
                {[
                  { strong: 'Multiple inputs', rest: 'PRDs, Figma, OpenAPI, raw user stories, or screenshots.' },
                  { strong: 'Smart deduping', rest: "Won't propose cases you've already written." },
                  { strong: 'Edge-case mode', rest: 'Toggle on for boundary, security, and error-path cases.' },
                  { strong: 'Reviewable diffs', rest: 'Accept, edit, or reject each case before it ships to a suite.' },
                ].map((li) => (
                  <li key={li.strong} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 12, padding: '12px 0', borderTop: `1px solid ${C.borderSubtle}`, fontSize: 14, color: C.textSecondary }}>
                    <span style={{ color: C.brand700, marginTop: 2 }}><IconCheck size={16} /></span>
                    <span><strong style={{ color: C.textPrimary, fontWeight: 600, display: 'block', marginBottom: 1 }}>{li.strong}</strong>{li.rest}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI mock */}
            <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 22, boxShadow: '0 8px 32px rgba(99,120,200,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 10.5, color: C.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 600, paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${C.borderSubtle}` }}>
                <span>AI STUDIO · GENERATE</span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: C.success }}><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999, background: C.success, marginRight: 6, boxShadow: '0 0 0 2px rgba(22,163,74,0.18)' }} />RUNNING</span>
                  SONNET 4.5 · 11s
                </span>
              </div>
              <div style={{ padding: '10px 12px', background: C.surface2, border: `1px solid ${C.borderSubtle}`, borderRadius: 8, fontFamily: MONO, fontSize: 12.5, color: C.textPrimary, marginBottom: 14, display: 'flex', gap: 8 }}>
                <span style={{ color: C.brand700, fontWeight: 700, flexShrink: 0 }}>&gt;</span>
                Generate test cases for the /webhooks endpoint, including retry, idempotency, and 4xx surfacing.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {[
                  { num: '01', name: 'webhooks.idempotencyKey_rejectDup', desc: 'Should 409 when same idempotency-key resent within 24h', tag: 'API' },
                  { num: '02', name: 'webhooks.retryBackoff_exponential', desc: 'Backoff schedule 1s/2s/8s/32s on 5xx delivery', tag: 'API' },
                  { num: '03', name: 'webhooks.signatureMismatch_429', desc: 'Drops payload & emits security event on hmac fail', tag: 'SEC' },
                  { num: '04', name: 'webhooks.dlq_after5Failures', desc: 'Moves to dead-letter after 5 consecutive 5xx', tag: 'API' },
                ].map((item) => (
                  <div key={item.num} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', background: C.surface0, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, width: 22, height: 22, borderRadius: 5, background: 'rgba(37,99,235,0.08)', color: C.brand700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(37,99,235,0.2)', flexShrink: 0 }}>{item.num}</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: C.textPrimary, fontFamily: MONO }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 1 }}>{item.desc}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, fontFamily: MONO, fontSize: 10.5, color: C.textTertiary, fontWeight: 600 }}>
                      <span style={{ background: C.success, color: '#fff', padding: '1px 6px', borderRadius: 3 }}>NEW</span>
                      {item.tag}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 11, color: C.textTertiary }}>
                <span><strong style={{ color: C.textPrimary, fontWeight: 600 }}>18 cases generated</strong> · 6 deduped</span>
                <span>+ 240 credits</span>
              </div>
            </div>
          </div>
        </Wrap>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TWO-UP: BUG TRACKING (reversed)
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '0 0 96px' }}>
        <Wrap>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 64, alignItems: 'center' }}>
            {/* Bug list mock — first child but visually second */}
            <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 0, boxShadow: '0 8px 32px rgba(99,120,200,0.1)', overflow: 'hidden', order: 2 }}>
              <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.textTertiary, letterSpacing: '0.06em', fontWeight: 600 }}>BUGS · ACME ROBOTICS · OPEN</span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.textTertiary, fontWeight: 600 }}>47 OPEN</span>
              </div>
              {/* Header row */}
              <div style={{ background: C.surface2, padding: '10px 16px', borderBottom: `1px solid ${C.borderSubtle}`, borderTop: `1px solid ${C.borderSubtle}`, display: 'grid', gridTemplateColumns: '50px 1fr 90px 70px', gap: 10, fontFamily: MONO, fontSize: 10, color: C.textTertiary, letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 600 }}>
                <span>SEV</span><span>BUG</span><span>OWNER</span><span>STATUS</span>
              </div>
              {/* Bug rows */}
              {[
                { sev: 'P0', sevColor: C.error, sevBg: 'rgba(220,38,38,0.08)', sevBorder: 'rgba(220,38,38,0.2)', title: 'Checkout total drifts by 1 cent on multi-currency coupon', meta: 'CHKO-2241 · Checkout v3 · opened 14m ago', initials: 'MK', name: 'Maya K.', status: 'OPEN', statusClass: 'open' },
                { sev: 'P1', sevColor: C.warning, sevBg: 'rgba(217,119,6,0.08)', sevBorder: 'rgba(217,119,6,0.2)', title: '429 not surfaced on retry — body suppressed by middleware', meta: 'API-1187 · Public API · opened 1h ago', initials: 'PR', name: 'Priya R.', status: 'REVIEW', statusClass: 'review' },
                { sev: 'P1', sevColor: C.warning, sevBg: 'rgba(217,119,6,0.08)', sevBorder: 'rgba(217,119,6,0.2)', title: 'Websocket rejoin fails after > 30s disconnect on Firefox', meta: 'WS-0901 · Realtime · opened 3h ago', initials: 'DA', name: 'Daichi A.', status: 'OPEN', statusClass: 'open' },
                { sev: 'P2', sevColor: '#2563eb', sevBg: 'rgba(37,99,235,0.08)', sevBorder: 'rgba(37,99,235,0.2)', title: 'Invoice PDF wraps long line-items mid-word', meta: 'BIL-0418 · Billing Service · opened 6h ago', initials: 'SP', name: 'Sara P.', status: 'OPEN', statusClass: 'open' },
                { sev: 'P2', sevColor: '#2563eb', sevBg: 'rgba(37,99,235,0.08)', sevBorder: 'rgba(37,99,235,0.2)', title: 'Coupon BOGO double-applies in cart on slow networks', meta: 'CHKO-2238 · Checkout v3 · opened 1d ago', initials: 'MK', name: 'Maya K.', status: 'FIXED', statusClass: 'fixed' },
              ].map((bug, i) => {
                const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                  open: { bg: 'rgba(220,38,38,0.06)', color: C.error, border: 'rgba(220,38,38,0.18)' },
                  fixed: { bg: 'rgba(22,163,74,0.06)', color: C.success, border: 'rgba(22,163,74,0.18)' },
                  review: { bg: 'rgba(217,119,6,0.06)', color: C.warning, border: 'rgba(217,119,6,0.18)' },
                }
                const sc = statusColors[bug.statusClass]
                return (
                  <div key={i} style={{ padding: '12px 16px', borderBottom: i < 4 ? `1px solid ${C.borderSubtle}` : 'none', display: 'grid', gridTemplateColumns: '50px 1fr 90px 70px', gap: 10, alignItems: 'center', fontSize: 13 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textAlign: 'center' as const, display: 'inline-block', minWidth: 36, background: bug.sevBg, color: bug.sevColor, border: `1px solid ${bug.sevBorder}` }}>{bug.sev}</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: C.textPrimary }}>{bug.title}</div>
                      <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2, fontFamily: MONO }}>{bug.meta}</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.textSecondary, display: 'flex', gap: 5, alignItems: 'center' }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, background: 'linear-gradient(135deg,#93c5fd,#2563eb)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{bug.initials}</span>
                      {bug.name}
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 999, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, textAlign: 'center' as const, display: 'inline-block' }}>{bug.status}</span>
                  </div>
                )
              })}
            </div>

            {/* Text col */}
            <div style={{ order: 1 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: C.brand700, textTransform: 'uppercase' as const }}>02 · Bug tracking</span>
              <h3 style={{ fontSize: 32, letterSpacing: '-0.022em', margin: '12px 0 12px', lineHeight: 1.1, maxWidth: '18ch', color: C.textPrimary }}>Bugs that link back to the tests that caught them.</h3>
              <p style={{ color: C.textSecondary, fontSize: 16, maxWidth: '44ch', marginBottom: 20 }}>
                P0–P3 severities, structured repro steps, video and screenshot attachments. Every bug ties to the test case that produced it, so regressions can&apos;t sneak back.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
                {[
                  { strong: 'Structured repro', rest: 'Numbered steps, expected vs. actual, environment fingerprint.' },
                  { strong: 'Jira & Linear sync', rest: 'Bidirectional. Severity and status flow in both directions.' },
                  { strong: 'Anti-regression', rest: 'A closed bug reopens if its linked test case ever fails again.' },
                  { strong: 'Public reports', rest: 'Generate a customer-friendly summary URL — no login needed.' },
                ].map((li) => (
                  <li key={li.strong} style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 12, padding: '12px 0', borderTop: `1px solid ${C.borderSubtle}`, fontSize: 14, color: C.textSecondary }}>
                    <span style={{ color: C.brand700, marginTop: 2 }}><IconCheck size={16} /></span>
                    <span><strong style={{ color: C.textPrimary, fontWeight: 600, display: 'block', marginBottom: 1 }}>{li.strong}</strong>{li.rest}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Wrap>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS BAND
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '0 0 96px' }}>
        <Wrap>
          <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', boxShadow: '0 2px 16px rgba(99,120,200,0.07)' }}>
            {[
              { n: '62', unit: '%', label: 'Median reduction in flaky test count after 90 days' },
              { n: '14×', label: 'More test coverage per QA engineer with AI Studio enabled' },
              { n: '4.2M', label: 'Test cases run last month across all customer workspaces' },
              { n: '99.98', unit: '%', label: '12-month uptime — see status.softassert.io' },
            ].map((s, i) => (
              <div key={s.n} style={{ padding: '28px 24px', borderRight: i < 3 ? `1px solid ${C.borderSubtle}` : 'none' }}>
                <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.024em', lineHeight: 1, marginBottom: 6, fontVariantNumeric: 'tabular-nums', color: C.brand700 }}>
                  {s.n}{s.unit && <span style={{ color: C.textTertiary, fontWeight: 500, fontSize: 22 }}>{s.unit}</span>}
                </div>
                <div style={{ fontSize: 13, color: C.textTertiary }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CUSTOMER QUOTES
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '0 0 96px' }}>
        <Wrap>
          <div style={{ marginBottom: 44, maxWidth: 680 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: C.brand700, textTransform: 'uppercase' as const, display: 'inline-block', marginBottom: 12 }}>Customer stories</span>
            <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.024em', margin: 0, lineHeight: 1.08, color: C.textPrimary }}>Faster releases, fewer regressions.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[
              { text: 'We migrated from TestRail and Jira and cut our suite-maintenance time in half. AI Studio writes the boring 70%, our engineers review and ship.', initials: 'MK', name: 'Maya Krishnan', role: 'Director of QA · Acme Robotics' },
              { text: 'The flaky test heatmap pays for itself. We dropped from 38 flakes to 4 in one quarter — just by looking at what the dashboard surfaced.', initials: 'DA', name: 'Daichi Akiyama', role: 'Staff Engineer · Pixel Studio' },
              { text: 'Bidirectional Jira sync was the unlock. Engineers fix in Jira, QA closes in softAssert, severity and status stay in lockstep. No more reconciliation meetings.', initials: 'PR', name: 'Priya Rao', role: 'VP Engineering · Northwind Labs' },
            ].map((q) => (
              <div key={q.name} style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column' as const, boxShadow: '0 2px 16px rgba(99,120,200,0.07)' }}>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: C.textPrimary, margin: '0 0 20px', flex: 1 }}>
                  <span style={{ fontFamily: MONO, color: C.brand700, fontSize: 28, lineHeight: 0, verticalAlign: '-0.2em', marginRight: 4, fontWeight: 700 }}>&ldquo;</span>
                  {q.text}
                </p>
                <div style={{ fontSize: 13, color: C.textTertiary, display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, borderTop: `1px solid ${C.borderSubtle}` }}>
                  <span style={{ width: 32, height: 32, borderRadius: 999, background: 'linear-gradient(135deg,#93c5fd,#2563eb)', color: '#fff', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{q.initials}</span>
                  <span>
                    <strong style={{ display: 'block', color: C.textPrimary, fontWeight: 600 }}>{q.name}</strong>
                    {q.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CTA BLOCK
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '0 0 96px' }}>
        <Wrap>
          <div style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
            borderRadius: 20, padding: '64px 56px',
            display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'center',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 24px 60px -16px rgba(30,58,138,0.4)',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 0%, rgba(99,163,255,0.18), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontSize: 36, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.024em', lineHeight: 1.1, maxWidth: '22ch' }}>
                Spin up a workspace in 60 seconds.
              </h2>
              <p style={{ color: 'rgba(226,232,248,0.75)', fontSize: 15.5, margin: 0, maxWidth: '44ch' }}>
                Free for solo QAs and teams up to 3. No credit card. Bring your existing test cases via CSV or TestRail import.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', position: 'relative', flexWrap: 'wrap' as const }}>
              <Link
                href="/register"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 44, padding: '0 20px', borderRadius: 8, background: '#fff', color: '#1e3a8a', border: '1px solid #fff', font: '600 14.5px/1 Inter, sans-serif', textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', cursor: 'pointer' }}
              >
                Start free
              </Link>
              <Link
                href="/contact"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 44, padding: '0 20px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.22)', font: '600 14.5px/1 Inter, sans-serif', textDecoration: 'none', cursor: 'pointer' }}
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </Wrap>
      </section>

      <MarketingFooter variant="light" />
    </div>
  )
}
