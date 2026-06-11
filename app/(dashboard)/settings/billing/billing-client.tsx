'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Zap, Users, Crown, AlertCircle, ExternalLink, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  plan: string
  hasStripe: boolean
  periodEnd: string | null
  gracePeriodEnd: string | null
  usage: {
    projects: number
    projectsMax: number
    aiCallsToday: number
    aiCallsMax: number
  }
}

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    monthlyPrice: '$0',
    annualPrice: '$0',
    period: 'forever',
    icon: <Zap className="h-5 w-5" />,
    features: [
      '1 project',
      '5 AI credits (one-time)',
      '30 test cases / project',
      '10 bug reports / project',
      'Manual suite execution',
    ],
    cta: null,
  },
  {
    id: 'PRO',
    name: 'Pro',
    monthlyPrice: '$12',
    annualPrice: '$9.60',
    period: '/month',
    annualBilled: 'billed $115/yr — save 20%',
    icon: <Crown className="h-5 w-5" />,
    highlight: true,
    features: [
      '10 projects',
      '150 AI credits / month',
      '1,500 test cases / project',
      '500 bug reports / project',
      'CSV + Excel + JSON export',
      'API testing module',
      'Test case versioning',
      'Screenshot annotation',
      'Custom project rules',
      'Webhook integrations',
      'AI bug tools (dedup + severity)',
      'Recording analysis',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'TEAM',
    name: 'Team',
    monthlyPrice: '$25',
    annualPrice: '$20',
    period: '/user/month',
    annualBilled: 'billed $240/user/yr — save 20%',
    icon: <Users className="h-5 w-5" />,
    features: [
      'Unlimited projects',
      '300 AI credits / user / month',
      'Unlimited test cases & bugs',
      'All Pro features',
      'Jira / Linear / GitHub / Azure DevOps',
      'Shared workspace',
      'Audit log',
      'Priority Slack support',
      'Custom SLA available',
    ],
    cta: 'Upgrade to Team',
  },
]

export default function BillingClient({ plan, hasStripe, periodEnd, gracePeriodEnd, usage }: Props) {
  const [loading, setLoading]     = useState<string | null>(null)
  const [interval, setInterval]   = useState<'monthly' | 'annual'>('monthly')
  const [upgraded, setUpgraded]   = useState(false)

  const router       = useRouter()
  const searchParams = useSearchParams()

  // After returning from checkout, refresh the server layout so the sidebar
  // plan badge reflects the new plan immediately.
  useEffect(() => {
    if (searchParams.get('success') !== 'true') return
    setUpgraded(true)
    // Poll briefly to wait for the webhook to update the DB, then re-render.
    let attempts = 0
    const id = setInterval(async () => {
      attempts++
      router.refresh()
      if (attempts >= 5) clearInterval(id)
    }, 2000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpgrade(targetPlan: 'PRO' | 'TEAM') {
    setLoading(targetPlan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, interval }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error('Could not start checkout. Please try again.')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error('Could not open billing portal.')
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(null)
    }
  }

  const periodEndDate     = periodEnd ? new Date(periodEnd).toLocaleDateString() : null
  const gracePeriodEndDate = gracePeriodEnd ? new Date(gracePeriodEnd).toLocaleDateString() : null
  const isLifetimeCredits = plan === 'FREE'
  const creditsLabel      = isLifetimeCredits ? 'AI credits used (lifetime)' : 'AI credits used this month'

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page header */}
      <div>
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Billing &amp; Plans
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your subscription and usage limits.
        </p>
      </div>

      {/* Success banner */}
      {upgraded && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)' }}
        >
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#16a34a' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: '#16a34a' }}>Payment successful!</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Your plan is being activated — this page will update automatically.
            </p>
          </div>
        </div>
      )}

      {/* Grace period warning */}
      {gracePeriodEndDate && (
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(201,42,42,0.08)', border: '1px solid rgba(201,42,42,0.2)' }}
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-error)' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-error)' }}>
              Payment failed — grace period ends {gracePeriodEndDate}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Update your payment method to avoid being downgraded to the Free plan.
            </p>
          </div>
          <button
            onClick={handlePortal}
            disabled={loading === 'portal'}
            className="ml-auto text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
            style={{ background: 'var(--color-error)', color: '#fff' }}
          >
            {loading === 'portal' ? 'Loading…' : 'Update payment'}
          </button>
        </div>
      )}

      {/* Current plan + usage */}
      <div
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>
              Current plan
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan}</span>
              {periodEndDate && (
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Renews {periodEndDate}
                </span>
              )}
            </div>
          </div>
          {hasStripe && (
            <button
              onClick={handlePortal}
              disabled={loading === 'portal'}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-150 hover:opacity-80"
              style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              {loading === 'portal' ? 'Loading…' : 'Manage subscription'}
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Usage bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <UsageBar label="Projects" current={usage.projects} max={usage.projectsMax} />
          <UsageBar label={creditsLabel} current={usage.aiCallsToday} max={usage.aiCallsMax} />
        </div>
      </div>

      {/* Billing interval toggle */}
      <div className="flex items-center justify-center">
        <div
          className="inline-flex items-center rounded-xl p-1 gap-1"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setInterval('monthly')}
            className="px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
            style={
              interval === 'monthly'
                ? { background: 'linear-gradient(135deg, #64748b, #475569)', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                : { color: 'var(--text-secondary)' }
            }
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('annual')}
            className="px-5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-1.5"
            style={
              interval === 'annual'
                ? { background: 'linear-gradient(135deg, #64748b, #475569)', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }
                : { color: 'var(--text-secondary)' }
            }
          >
            Annual
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: interval === 'annual' ? 'rgba(255,255,255,0.2)' : 'rgba(100,116,139,0.12)',
                color: interval === 'annual' ? '#fff' : '#64748b',
              }}
            >
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const isCurrent = plan === p.id
          const isHigher  = (p.id === 'PRO' && plan === 'FREE') || (p.id === 'TEAM' && plan !== 'TEAM')
          const price     = interval === 'annual' ? p.annualPrice : p.monthlyPrice

          return (
            <div
              key={p.id}
              className="rounded-2xl p-5 flex flex-col"
              style={{
                background: p.highlight
                  ? 'linear-gradient(145deg, rgba(100,116,139,0.12) 0%, rgba(148,163,184,0.06) 100%)'
                  : 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(12px)',
                border: isCurrent
                  ? '2px solid rgba(100,116,139,0.5)'
                  : p.highlight
                  ? '1px solid rgba(100,116,139,0.25)'
                  : '1px solid var(--border)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: p.highlight
                        ? 'linear-gradient(135deg, #64748b, #475569)'
                        : 'var(--surface-2)',
                      color: p.highlight ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {p.icon}
                  </div>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                </div>
                {isCurrent && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: 'rgba(100,116,139,0.15)', color: '#64748b' }}
                  >
                    Current
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{price}</span>
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{p.period}</span>
                </div>
                {interval === 'annual' && p.annualBilled && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{p.annualBilled}</p>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#64748b' }} />
                    {f}
                  </li>
                ))}
              </ul>

              {p.cta && isHigher && (
                <button
                  onClick={() => handleUpgrade(p.id as 'PRO' | 'TEAM')}
                  disabled={loading === p.id}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  style={
                    p.highlight
                      ? { background: 'linear-gradient(135deg, #64748b, #475569)', color: '#fff' }
                      : { background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                  }
                >
                  {loading === p.id ? 'Loading…' : p.cta}
                </button>
              )}
              {isCurrent && p.id !== 'FREE' && (
                <p className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Manage via billing portal above
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const unlimited = max === -1
  const pct = unlimited ? 0 : Math.min(Math.round((current / max) * 100), 100)
  const isWarning = !unlimited && pct >= 80
  const isDanger  = !unlimited && pct >= 95

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-semibold tabular-nums" style={{ color: isDanger ? 'var(--color-error)' : 'var(--text-primary)' }}>
          {current}{unlimited ? '' : ` / ${max}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(pct, 2)}%`,
              background: isDanger
                ? 'linear-gradient(90deg, #f87171, #ef4444)'
                : isWarning
                ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                : 'linear-gradient(90deg, #94a3b8, #64748b)',
            }}
          />
        </div>
      )}
    </div>
  )
}
