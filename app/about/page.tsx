import Link from 'next/link'
import {
  FlaskConical, ArrowRight, Target, Heart, Zap,
  Users, Shield, Lightbulb, CheckCircle2, Sparkles,
  FileText, Code2, BarChart3,
} from 'lucide-react'
import { MarketingNav } from '@/components/marketing-nav'
import { MarketingFooter } from '@/components/marketing-footer'

const VALUES = [
  {
    icon: Target,
    title: 'QA-first, always',
    description: 'We build for QA engineers, not managers. Every feature is designed around the workflow of someone who actually writes and runs tests.',
    color: '#2563eb',
  },
  {
    icon: Zap,
    title: 'Speed without shortcuts',
    description: 'AI accelerates the tedious parts — not the thinking. We generate structure so you can focus on what matters: finding real bugs.',
    color: '#d97706',
  },
  {
    icon: Shield,
    title: 'Data you can trust',
    description: 'Your test cases and bug reports are yours. We never use your project data to train AI models, full stop.',
    color: '#16a34a',
  },
  {
    icon: Heart,
    title: 'Simple by design',
    description: "QA tooling doesn't have to be complicated. We obsess over removing friction so you spend less time clicking and more time testing.",
    color: '#e11d48',
  },
  {
    icon: Lightbulb,
    title: 'Opinionated defaults',
    description: 'Good test cases follow patterns. We encode QA best practices into every generation — happy paths, edge cases, security checks.',
    color: '#7c3aed',
  },
  {
    icon: Users,
    title: 'Built with the community',
    description: 'Features come from real conversations with QA engineers. If you have a workflow we should support, we want to hear about it.',
    color: '#059669',
  },
]

const TIMELINE = [
  { year: '2024', title: 'The frustration', desc: 'We were QA engineers ourselves, spending hours writing test cases for every sprint. There had to be a better way.' },
  { year: 'Q1 2025', title: 'First prototype', desc: 'Built the first AI test generation prototype using Claude. Generated 40 test cases in 45 seconds. We knew we were onto something.' },
  { year: 'Q2 2025', title: 'Beta launch', desc: 'Opened the beta to 50 QA engineers. Feedback poured in — bug reporting, regression suites, and Jira integration were the most requested features.' },
  { year: 'Q3 2025', title: 'Public launch', desc: 'softAssert v1.0 launched publicly with AI generation, bug tracking, suite execution, and full export. 500+ sign-ups in the first month.' },
]

const HOW_STEPS = [
  {
    icon: FileText,
    step: '01',
    title: 'Describe what you built',
    description: "Paste a user story, PRD excerpt, or plain English description of a feature. softAssert doesn't need structured input — natural language works fine.",
    color: '#2563eb',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'AI builds your test suite',
    description: 'Claude AI analyzes your description and generates a structured set of test cases: happy paths, negative tests, edge cases, and security checks.',
    color: '#7c3aed',
  },
  {
    icon: Code2,
    step: '03',
    title: 'Execute, track, and export',
    description: 'Run suites directly in softAssert, mark pass/fail, track trends. Export to Jira, Linear, Excel, or Playwright test skeletons.',
    color: '#059669',
  },
  {
    icon: BarChart3,
    step: '04',
    title: 'Improve over time',
    description: 'softAssert learns what kinds of tests matter for your product. Bug history informs test focus. Coverage gaps become visible.',
    color: '#d97706',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute rounded-full" style={{ top: '-10%', right: '-6%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ bottom: '10%', left: '-8%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 65%)' }} />
      </div>

      <MarketingNav variant="light" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 lg:px-12 pt-20 pb-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#1d4ed8' }}
          >
            <FlaskConical className="h-3 w-3" />
            About softAssert
          </div>
          <h1 className="text-[44px] sm:text-5xl font-extrabold tracking-tight mb-6 leading-[1.08]" style={{ color: '#0f172a' }}>
            Built by QA engineers,<br />for QA engineers
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: '#475569' }}>
            We got tired of spending half our sprints writing test cases manually. softAssert exists to give QA teams back their time — so they can focus on finding real bugs, not writing boilerplate.
          </p>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
            style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.14)' }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#2563eb' }}>Our mission</p>
              <h2 className="text-3xl font-bold mb-4 leading-tight" style={{ color: '#0f172a' }}>
                Eliminate manual test case writing — forever
              </h2>
              <p className="text-[15px] leading-relaxed" style={{ color: '#475569' }}>
                Test cases are a means to an end: finding bugs before users do. When writing them takes 4 hours per sprint, something is broken. softAssert uses AI to handle the structure so your team can focus on the thinking that actually matters.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Test cases generated', value: '250,000+' },
                { label: 'QA engineers using softAssert', value: '500+' },
                { label: 'Hours saved per team / sprint', value: '~6 hrs' },
                { label: 'Countries with active teams', value: '28' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: '#ffffff', border: '1px solid rgba(37,99,235,0.12)' }}
                >
                  <span className="text-sm" style={{ color: '#475569' }}>{stat.label}</span>
                  <span className="font-bold" style={{ color: '#0f172a' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#2563eb' }}>How it works</p>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#0f172a' }}>From description to test suite in minutes</h2>
            <p style={{ color: '#94a3b8' }}>No setup, no training data, no complicated config.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {HOW_STEPS.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl p-7"
                style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.12)', boxShadow: '0 1px 8px rgba(99,120,200,0.06)' }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}
                  >
                    <s.icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                  <span className="text-3xl font-black" style={{ color: `${s.color}20` }}>{s.step}</span>
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#0f172a' }}>{s.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: '#64748b' }}>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story / Timeline ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#2563eb' }}>Our story</p>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#0f172a' }}>How softAssert came to be</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[18px] top-3 bottom-3 w-px"
              style={{ background: 'rgba(37,99,235,0.15)' }}
            />
            <div className="space-y-10">
              {TIMELINE.map((item, i) => (
                <div key={i} className="flex gap-6 relative">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold relative z-10"
                    style={{
                      background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)',
                      color: '#fff',
                      boxShadow: '0 0 12px rgba(37,99,235,0.3)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="pt-1">
                    <div className="text-xs font-semibold mb-1" style={{ color: '#2563eb' }}>{item.year}</div>
                    <h3 className="font-bold mb-1.5" style={{ color: '#0f172a' }}>{item.title}</h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: '#64748b' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#2563eb' }}>Our values</p>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#0f172a' }}>What we believe in</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.12)', boxShadow: '0 1px 8px rgba(99,120,200,0.06)' }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${v.color}10`, border: `1px solid ${v.color}25` }}
                >
                  <v.icon className="h-5 w-5" style={{ color: v.color }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#0f172a' }}>{v.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: '#64748b' }}>{v.description}</p>
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
            Ready to transform your QA workflow?
          </h2>
          <p className="mb-8 relative" style={{ color: 'rgba(226,232,248,0.75)' }}>
            Start free. No credit card required. First test suite in under 3 minutes.
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
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-medium text-white transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)' }}
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter variant="light" />
    </div>
  )
}
