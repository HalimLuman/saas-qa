import Link from 'next/link'
import {
  X, ArrowRight, Zap, Shield, CheckCircle2, HelpCircle, Check,
} from 'lucide-react'
import { MarketingNav } from '@/components/marketing-nav'
import { MarketingFooter } from '@/components/marketing-footer'
import PricingPlans from './pricing-plans'

const PLANS = [
  { name: 'Free',  price: '$0',  period: '' },
  { name: 'Pro',   price: '$12', period: '/mo' },
  { name: 'Team',  price: '$25', period: '/user/mo' },
]

const COMPARISON_ROWS: { feature: string; free: string | boolean; pro: string | boolean; team: string | boolean }[] = [
  { feature: 'Projects', free: '1', pro: '10', team: 'Unlimited' },
  { feature: 'AI credits', free: '5 one-time', pro: '150 / mo', team: '300 / user / mo' },
  { feature: 'Test cases / project', free: '30', pro: '1,500', team: 'Unlimited' },
  { feature: 'Bug reports / project', free: '10', pro: '500', team: 'Unlimited' },
  { feature: 'CSV export', free: false, pro: true, team: true },
  { feature: 'Excel & JSON export', free: false, pro: true, team: true },
  { feature: 'Suite execution', free: true, pro: true, team: true },
  { feature: 'API testing module', free: false, pro: true, team: true },
  { feature: 'Test case versioning', free: false, pro: true, team: true },
  { feature: 'Screenshot annotation', free: false, pro: true, team: true },
  { feature: 'Custom project rules', free: false, pro: true, team: true },
  { feature: 'Webhook integrations', free: false, pro: true, team: true },
  { feature: 'AI bug tools (dedup + severity)', free: false, pro: true, team: true },
  { feature: 'Recording analysis', free: false, pro: true, team: true },
  { feature: 'Jira / Linear / GitHub push', free: false, pro: false, team: true },
  { feature: 'Shared team workspace', free: false, pro: false, team: true },
  { feature: 'Audit log', free: false, pro: false, team: true },
  { feature: 'SSO / SAML', free: false, pro: false, team: 'Add-on' },
  { feature: 'Support', free: 'Community', pro: 'Email', team: 'Slack + SLA' },
]

const FAQS = [
  {
    q: 'What are AI credits?',
    a: 'Each AI credit represents one test-generation run. On the Free plan you get 5 credits total — enough to explore the product. Pro users get 150 credits every month; Team users get 300 per user per month. Credits reset on the 1st of each month.',
  },
  {
    q: 'Is the Free plan really free forever?',
    a: "Yes. The Free plan has no time limit and no credit card required. The 5 AI credits are a one-time allocation — once used you'll need to upgrade to keep generating test cases with AI.",
  },
  {
    q: 'What happens when I use up my monthly credits?',
    a: 'Your credits reset on the 1st of each month. Until then you can still work with all your existing test cases, run suites, manage bugs, and use every other feature — you just cannot generate new AI test cases.',
  },
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. Upgrades take effect immediately. Downgrades take effect at the end of your current billing cycle, so you keep full access until then.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards via Stripe. For Team plans on annual billing we can also issue invoices.',
  },
  {
    q: 'Do you offer a money-back guarantee?',
    a: "Yes — Pro comes with a 14-day money-back guarantee. If you're not satisfied in the first 14 days, email us for a full refund, no questions asked.",
  },
  {
    q: 'Is there a discount for annual billing?',
    a: 'Yes — annual billing saves you 20% (equivalent to getting ~2.5 months free). Contact us to switch to annual.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: "You keep access to your data on the Free plan. Export all test cases, bugs, and suites before cancelling — nothing is locked away.",
  },
]

type CellValue = string | boolean

function ComparisonCell({ value, highlight }: { value: CellValue; highlight: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 mx-auto" style={{ color: highlight ? '#2563eb' : '#16a34a' }} />
    ) : (
      <X className="h-4 w-4 mx-auto" style={{ color: 'rgba(148,163,184,0.5)' }} />
    )
  }
  return (
    <span className="text-sm text-center block" style={{ color: highlight ? '#1d4ed8' : '#475569' }}>
      {value}
    </span>
  )
}

export default function PricingPage() {
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
            <Zap className="h-3 w-3" />
            Simple, honest pricing
          </div>
          <h1 className="text-[44px] sm:text-5xl font-extrabold tracking-tight mb-5 leading-[1.08]" style={{ color: '#0f172a' }}>
            Start free. Pay when you grow.
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: '#475569' }}>
            No hidden fees, no complicated tiers. Upgrade when you hit limits and downgrade any time.
          </p>
        </div>
      </section>

      {/* ── Plan cards with billing toggle ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-20">
        <PricingPlans />
      </section>

      {/* ── Comparison table ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#0f172a' }}>Full plan comparison</h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(99,120,200,0.12)' }}
          >
            {/* Header */}
            <div
              className="grid grid-cols-4 gap-0"
              style={{ borderBottom: '1px solid rgba(99,120,200,0.12)', background: '#f8faff' }}
            >
              <div className="p-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                Feature
              </div>
              {PLANS.map((p) => (
                <div key={p.name} className="p-4 text-center">
                  <div className="font-bold text-sm" style={{ color: '#0f172a' }}>{p.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{p.price}{p.period}</div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className="grid grid-cols-4"
                style={{
                  borderBottom: i < COMPARISON_ROWS.length - 1 ? '1px solid rgba(99,120,200,0.08)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(99,120,200,0.02)',
                }}
              >
                <div className="p-4 text-sm" style={{ color: '#475569' }}>
                  {row.feature}
                </div>
                <div className="p-4 flex items-center justify-center">
                  <ComparisonCell value={row.free} highlight={false} />
                </div>
                <div className="p-4 flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.03)' }}>
                  <ComparisonCell value={row.pro} highlight />
                </div>
                <div className="p-4 flex items-center justify-center">
                  <ComparisonCell value={row.team} highlight={false} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust badges ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Shield, title: 'Your data, always', desc: 'We never use your project data to train AI models. Export and delete any time.' },
            { icon: Zap, title: 'No lock-in', desc: 'Export all test cases and bugs to CSV/Excel before you leave. Nothing is locked away.' },
            { icon: CheckCircle2, title: '14-day guarantee', desc: 'If Pro does not work for you in the first 14 days, we refund you. No questions.' },
          ].map((b) => (
            <div
              key={b.title}
              className="rounded-2xl p-6 text-center"
              style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.12)', boxShadow: '0 1px 8px rgba(99,120,200,0.06)' }}
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)' }}
              >
                <b.icon className="h-5 w-5" style={{ color: '#2563eb' }} />
              </div>
              <h3 className="font-bold mb-2" style={{ color: '#0f172a' }}>{b.title}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: '#64748b' }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-10 justify-center">
            <HelpCircle className="h-6 w-6" style={{ color: '#2563eb' }} />
            <h2 className="text-3xl font-bold" style={{ color: '#0f172a' }}>Pricing FAQ</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl p-6"
                style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.12)', boxShadow: '0 1px 6px rgba(99,120,200,0.05)' }}
              >
                <h3 className="font-semibold mb-2 text-[15px]" style={{ color: '#0f172a' }}>{faq.q}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: '#475569' }}>{faq.a}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-sm" style={{ color: '#94a3b8' }}>
            Still have questions?{' '}
            <Link href="/contact" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#2563eb' }}>
              Contact us →
            </Link>
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-28">
        <div
          className="max-w-3xl mx-auto rounded-2xl p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', boxShadow: '0 24px 60px -16px rgba(30,58,138,0.35)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 0%, rgba(99,163,255,0.18), transparent 60%)', pointerEvents: 'none' }} />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 relative">Start for free today</h2>
          <p className="mb-8 relative" style={{ color: 'rgba(226,232,248,0.75)' }}>
            No credit card needed. Generate your first test suite in under 3 minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold transition-all hover:opacity-90 relative"
            style={{ background: '#ffffff', color: '#1e3a8a', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
          >
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter variant="light" />
    </div>
  )
}
