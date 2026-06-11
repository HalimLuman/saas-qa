'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, CheckCircle2 } from 'lucide-react'

const PLANS = [
  {
    name: 'Free',
    monthlyPrice: '$0',
    annualPrice: '$0',
    period: '/mo',
    description: 'Try softAssert with a real project. No credit card needed.',
    highlight: false,
    features: [
      '1 project',
      '5 AI credits (one-time)',
      '30 test cases / project',
      '10 bug reports / project',
      'Manual suite execution',
    ],
    cta: 'Get started free',
    href: '/register',
  },
  {
    name: 'Pro',
    monthlyPrice: '$12',
    annualPrice: '$9.60',
    period: '/mo',
    annualBilled: 'billed $115/yr',
    description: 'Everything a professional QA engineer needs.',
    highlight: true,
    badge: 'Most popular',
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
    cta: 'Start Pro — 14-day guarantee',
    href: '/register',
  },
  {
    name: 'Team',
    monthlyPrice: '$25',
    annualPrice: '$20',
    period: '/user/mo',
    annualBilled: 'billed $240/user/yr',
    description: 'Shared workflows for QA teams that move together.',
    highlight: false,
    features: [
      'Unlimited projects',
      '300 AI credits / user / month',
      'Unlimited test cases & bugs',
      'All Pro features',
      'Jira / Linear / GitHub / Azure DevOps',
      'Shared workspace',
      'Audit log',
      'Priority Slack support (24 h)',
      'Custom SLA available',
    ],
    cta: 'Contact us',
    href: '/contact',
  },
]

export default function PricingPlans() {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')

  return (
    <>
      {/* Billing interval toggle */}
      <div className="flex justify-center mb-10">
        <div
          className="inline-flex items-center rounded-xl p-1 gap-1"
          style={{ background: '#f1f5f9', border: '1px solid rgba(99,120,200,0.14)' }}
        >
          <button
            onClick={() => setInterval('monthly')}
            className="px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={
              interval === 'monthly'
                ? { background: '#fff', color: '#0f172a', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                : { color: '#94a3b8' }
            }
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('annual')}
            className="px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-150 flex items-center gap-2"
            style={
              interval === 'annual'
                ? { background: '#fff', color: '#0f172a', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                : { color: '#94a3b8' }
            }
          >
            Annual
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: interval === 'annual' ? 'rgba(37,99,235,0.1)' : 'rgba(99,120,200,0.1)',
                color: interval === 'annual' ? '#1d4ed8' : '#64748b',
                border: interval === 'annual' ? '1px solid rgba(37,99,235,0.25)' : 'none',
              }}
            >
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
        {PLANS.map((plan) => {
          const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice

          return (
            <div
              key={plan.name}
              className="rounded-2xl p-7 flex flex-col relative"
              style={{
                background: plan.highlight ? 'rgba(37,99,235,0.04)' : '#ffffff',
                border: plan.highlight ? '1px solid rgba(37,99,235,0.35)' : '1px solid rgba(99,120,200,0.14)',
                boxShadow: plan.highlight
                  ? '0 0 0 1px rgba(37,99,235,0.08), 0 24px 60px rgba(37,99,235,0.1)'
                  : '0 1px 8px rgba(99,120,200,0.06)',
              }}
            >
              {plan.badge && (
                <div
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full self-start mb-5"
                  style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', color: '#1d4ed8' }}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div className="font-bold text-[18px]" style={{ color: '#0f172a' }}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-[38px] font-extrabold leading-none" style={{ color: '#0f172a' }}>{price}</span>
                  <span className="text-sm" style={{ color: '#94a3b8' }}>{plan.period}</span>
                </div>
                {interval === 'annual' && plan.annualBilled && (
                  <p className="text-[12px] mt-1 font-medium" style={{ color: '#2563eb' }}>{plan.annualBilled}</p>
                )}
                <p className="text-[13px] mt-2" style={{ color: '#94a3b8' }}>{plan.description}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px]" style={{ color: '#475569' }}>
                    <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: plan.highlight ? '#2563eb' : '#16a34a' }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="text-center text-sm font-semibold py-3 rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                style={
                  plan.highlight
                    ? { background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)', color: '#fff', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }
                    : { background: '#f8faff', border: '1px solid rgba(99,120,200,0.2)', color: '#475569' }
                }
              >
                {plan.cta}
              </Link>

              {plan.highlight && (
                <p className="text-center text-[11px] mt-3" style={{ color: '#94a3b8' }}>
                  14-day money-back guarantee
                </p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
