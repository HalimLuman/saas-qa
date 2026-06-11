'use client'

import { useState } from 'react'
import { X, Zap } from 'lucide-react'
import Link from 'next/link'

interface Props {
  limitType: 'aiCredits' | 'projects' | 'testCasesPerProject' | 'bugsPerProject'
  current: number
  max: number
  plan: string
  isLifetime?: boolean
  className?: string
}

const MESSAGES: Record<Props['limitType'], (current: number, max: number, isLifetime?: boolean) => string> = {
  aiCredits: (c, m, isLifetime) =>
    isLifetime
      ? `You've used ${c} of your ${m} free AI credits.`
      : `You've used ${c}/${m} AI credits this month.`,
  projects: (c, m) => `You've reached the ${m}-project limit for your plan.`,
  testCasesPerProject: (c, m) => `This project has ${c}/${m} test cases.`,
  bugsPerProject: (c, m) => `This project has ${c}/${m} bug reports.`,
}

export function UpgradePrompt({ limitType, current, max, plan, isLifetime, className }: Props) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || plan !== 'FREE') return null

  const pct = Math.round((current / max) * 100)
  if (pct < 80) return null

  return (
    <div
      className={`rounded-xl p-3 space-y-2.5 ${className ?? ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(100,116,139,0.15) 0%, rgba(59,130,246,0.1) 100%)',
        border: '1px solid rgba(100,116,139,0.25)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium leading-snug" style={{ color: 'rgba(148,163,184,0.9)' }}>
          {MESSAGES[limitType](current, max, isLifetime)}
        </p>
        <button onClick={() => setDismissed(true)} className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity">
          <X className="h-3 w-3 text-white" />
        </button>
      </div>
      <Link
        href="/settings/billing"
        className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
        style={{ color: '#94a3b8' }}
      >
        <Zap className="h-3 w-3" />
        Upgrade to Pro →
      </Link>
    </div>
  )
}
