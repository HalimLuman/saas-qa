import Link from 'next/link'
import {
  ArrowRight, Sparkles, FlaskConical, Bug, PlayCircle,
  BarChart3, Plug, GitBranch, FileDown, Shield, Search,
  Layers, Code2, Check, Zap, Clock, RefreshCw,
} from 'lucide-react'
import { MarketingNav } from '@/components/marketing-nav'
import { MarketingFooter } from '@/components/marketing-footer'

const CORE_FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Test Generation',
    desc: 'Generate structured test suites from PRDs, Figma frames, OpenAPI specs, or plain English — in seconds.',
    color: '#8b5cf6',
  },
  {
    icon: Layers,
    title: 'Test Management',
    desc: 'Organize cases by area, version, and priority. Full edit history with one-click restore.',
    color: '#3b82f6',
  },
  {
    icon: Bug,
    title: 'Bug Tracking',
    desc: 'P0–P3 severity, repro steps, screenshots, and video. Every bug links back to the test case that found it.',
    color: '#f43f5e',
  },
  {
    icon: PlayCircle,
    title: 'Suite Execution',
    desc: 'Build smoke, regression, and release suites. Run on-demand, on a schedule, or trigger via webhook.',
    color: '#10b981',
  },
  {
    icon: Code2,
    title: 'API Testing',
    desc: 'Define collections, add assertions, manage environments. Run requests directly from softAssert.',
    color: '#f59e0b',
  },
  {
    icon: Plug,
    title: 'Integrations',
    desc: 'Push bugs and test results to Jira, Linear, or GitHub. Bidirectional sync keeps status in lockstep.',
    color: '#06b6d4',
  },
  {
    icon: BarChart3,
    title: 'Insights & Analytics',
    desc: 'Coverage trends, flaky test heatmaps, and per-area health scores — all in one dashboard.',
    color: '#8b5cf6',
  },
  {
    icon: GitBranch,
    title: 'CI/CD Pipelines',
    desc: 'Trigger suite runs on every PR or deploy via webhooks. Status rolls back into your pipeline.',
    color: '#10b981',
  },
  {
    icon: FileDown,
    title: 'Export Everywhere',
    desc: 'CSV, Excel, JSON, or Playwright test skeletons. Own your data and move it anywhere.',
    color: '#2563eb',
  },
]

const AI_CAPABILITIES = [
  { label: 'Input types', value: 'PRDs, Figma, OpenAPI, screenshots, plain text' },
  { label: 'Test types', value: 'Happy path, negative, edge case, security, performance' },
  { label: 'Smart deduping', value: "Won't re-propose cases you already have" },
  { label: 'Edge-case mode', value: 'Toggle on for boundary, injection, and error-path cases' },
  { label: 'Reviewable diffs', value: 'Accept, edit, or reject each case before it lands' },
  { label: 'Credit usage', value: 'Transparent token usage per generation session' },
]

const BUG_FEATURES = [
  { icon: Search, text: 'AI-powered duplicate detection before you file' },
  { icon: Shield, text: 'Severity auto-suggested based on test failure context' },
  { icon: RefreshCw, text: 'Anti-regression: closed bugs reopen if the test fails again' },
  { icon: Zap, text: 'One-click push to Jira, Linear, or GitHub Issues' },
  { icon: Clock, text: 'Full audit trail of status and severity changes' },
  { icon: FileDown, text: 'Public summary URL — shareable without login' },
]

const SUITE_STEPS = [
  { n: '01', title: 'Build the suite', desc: 'Pick test cases from any area or search across your whole project. Drag to reorder.' },
  { n: '02', title: 'Choose a trigger', desc: 'Run manually, on a cron schedule, or hook it to your deploy pipeline via webhook.' },
  { n: '03', title: 'Execute & mark', desc: 'Pass, fail, or skip each case. Add notes and screenshots inline during execution.' },
  { n: '04', title: 'Review the run', desc: 'Full run history with trends, flaky-test highlighting, and time-to-fix tracking.' },
]

const INTEGRATIONS = [
  { name: 'Jira', desc: 'Bidirectional sync. Bugs flow in, fix status flows back.' },
  { name: 'Linear', desc: 'Push issues directly. Severity and priority preserved.' },
  { name: 'GitHub', desc: 'Create issues from bugs. Link PRs to test runs.' },
  { name: 'Slack', desc: 'Suite run summaries and P0 alerts straight to your channel.' },
  { name: 'Webhooks', desc: 'Trigger any suite from any CI/CD pipeline.' },
  { name: 'CSV / Excel', desc: 'Import from TestRail, spreadsheets, or any tool.' },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute rounded-full" style={{ top: '-10%', right: '-6%', width: 800, height: 800, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ bottom: '5%', left: '-8%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 65%)' }} />
      </div>

      <MarketingNav variant="light" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 lg:px-12 pt-20 pb-20 text-center">
        <div className="max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#1d4ed8' }}
          >
            <FlaskConical className="h-3 w-3" />
            softAssert Features
          </div>
          <h1 className="text-[44px] sm:text-5xl font-extrabold tracking-tight mb-6 leading-[1.08]" style={{ color: '#0f172a' }}>
            Every tool your QA team<br />will actually use
          </h1>
          <p className="text-lg leading-relaxed mb-10" style={{ color: '#475569' }}>
            softAssert replaces your test spreadsheet, your bug tracker, and your manual generation workflow — unified, AI-powered, and built for engineers who care about shipping quality software.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)', boxShadow: '0 8px 32px rgba(37,99,235,0.3)' }}
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-medium transition-all hover:opacity-90"
              style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.2)', color: '#475569' }}
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#2563eb' }}>Everything included</p>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#0f172a' }}>One platform, full coverage</h2>
            <p style={{ color: '#94a3b8' }}>No tabs between tools. No copy-paste. No context switching.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CORE_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.12)', boxShadow: '0 1px 8px rgba(99,120,200,0.06)' }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}12`, border: `1px solid ${f.color}28` }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold mb-1.5" style={{ color: '#0f172a' }}>{f.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Studio deep dive ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#7c3aed' }}>01 · AI Studio</p>
              <h2 className="text-3xl font-bold mb-4 leading-tight" style={{ color: '#0f172a' }}>
                Generate test cases from anything, in seconds
              </h2>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#475569' }}>
                Paste a PRD, drop a Figma frame, or point softAssert at an OpenAPI spec. Claude AI returns structured, named test cases — not paragraphs of prose — ready to review and run.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ color: '#7c3aed' }}
              >
                Try AI Studio free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {AI_CAPABILITIES.map((cap) => (
                <div
                  key={cap.label}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: '#ffffff', border: '1px solid rgba(139,92,246,0.12)' }}
                >
                  <div
                    className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
                  >
                    <Check className="h-3 w-3" style={{ color: '#7c3aed' }} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>{cap.label}</span>
                    <span className="text-sm" style={{ color: '#64748b' }}> — {cap.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bug Tracking deep dive ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            style={{ background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.12)' }}
          >
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUG_FEATURES.map((b) => (
                  <div
                    key={b.text}
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: '#ffffff', border: '1px solid rgba(244,63,94,0.1)' }}
                  >
                    <b.icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#f43f5e' }} />
                    <span className="text-[13px]" style={{ color: '#475569' }}>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#e11d48' }}>02 · Bug Tracking</p>
              <h2 className="text-3xl font-bold mb-4 leading-tight" style={{ color: '#0f172a' }}>
                Bugs that link back to the tests that found them
              </h2>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#475569' }}>
                Structured P0–P3 severity, repro steps, screenshots, and video attachments. The test case that caught the bug is always one click away — and if the bug is re-introduced, softAssert catches it again.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ color: '#e11d48' }}
              >
                Explore bug tracking <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Suite Execution deep dive ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#059669' }}>03 · Suite Execution</p>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#0f172a' }}>From zero to running suite in four steps</h2>
            <p style={{ color: '#94a3b8' }}>Smoke, regression, or release — softAssert handles all three.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SUITE_STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl p-7"
                style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.12)', boxShadow: '0 1px 8px rgba(99,120,200,0.06)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669' }}
                  >
                    {s.n}
                  </div>
                  <h3 className="font-bold" style={{ color: '#0f172a' }}>{s.title}</h3>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: '#64748b' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#2563eb' }}>Integrations</p>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#0f172a' }}>Works with your existing stack</h2>
            <p style={{ color: '#94a3b8' }}>No rip-and-replace. Connect the tools your team already uses.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATIONS.map((i) => (
              <div
                key={i.name}
                className="rounded-2xl p-6"
                style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.12)', boxShadow: '0 1px 8px rgba(99,120,200,0.06)' }}
              >
                <div className="font-bold mb-1.5" style={{ color: '#0f172a' }}>{i.name}</div>
                <p className="text-[13px]" style={{ color: '#64748b' }}>{i.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security & data trust band ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl p-8 sm:p-10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
            style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)' }}
          >
            {[
              { icon: Shield, title: 'Your data stays yours', desc: 'We never use your test cases or bug reports to train AI models. Export and delete any time.', color: '#2563eb' },
              { icon: Zap, title: 'Zero lock-in', desc: 'Every test case, bug, and run is exportable to CSV, Excel, or JSON. Nothing is trapped inside softAssert.', color: '#d97706' },
              { icon: RefreshCw, title: '99.98% uptime', desc: 'Built on Vercel edge infrastructure. Status and incident history available at status.softassert.io.', color: '#059669' },
            ].map((b) => (
              <div key={b.title}>
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: `${b.color}10`, border: `1px solid ${b.color}25` }}
                >
                  <b.icon className="h-5 w-5" style={{ color: b.color }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#0f172a' }}>{b.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: '#64748b' }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-28">
        <div
          className="max-w-3xl mx-auto rounded-2xl p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', boxShadow: '0 24px 60px -16px rgba(30,58,138,0.35)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 0%, rgba(99,163,255,0.18), transparent 60%)', pointerEvents: 'none' }} />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 relative">
            See it in action — for free
          </h2>
          <p className="mb-8 relative" style={{ color: 'rgba(226,232,248,0.75)' }}>
            No credit card. No setup. Generate your first AI test suite in under three minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all hover:opacity-90"
              style={{ background: '#ffffff', color: '#1e3a8a', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-medium text-white transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)' }}
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter variant="light" />
    </div>
  )
}
