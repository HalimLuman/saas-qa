'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FlaskConical, AlertCircle, ArrowRight, Eye, EyeOff, Check } from 'lucide-react'

const PERKS = [
  '5 AI generations per day — no card needed',
  '50 test cases & 10 bugs per project',
  'Suite execution & version history',
  'CSV export and Jira / GitHub sync',
]

function InputField({
  id, label, type, value, onChange, placeholder, autoComplete, required, minLength,
  right,
}: {
  id: string; label: string; type: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string; autoComplete: string; required?: boolean; minLength?: number
  right?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full h-[42px] text-sm rounded transition-all"
          style={{
            paddingLeft: '0.875rem',
            paddingRight: right ? '2.5rem' : '0.875rem',
            color: 'var(--text-primary)',
            background: '#ffffff',
            border: `1px solid ${focused ? 'rgba(37,99,235,0.55)' : 'var(--border)'}`,
            boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
            outline: 'none',
          }}
        />
        {right && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
        )}
      </div>
    </div>
  )
}

function PasswordStrength({ password }: { password: string }) {
  if (!password.length) return null
  const strength = password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const labels = ['', 'Too short', 'Good', 'Strong']
  const colors = ['', '#ef4444', '#f59e0b', '#22c55e']
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3].map((lvl) => (
          <div
            key={lvl}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: lvl <= strength ? colors[strength] : 'rgba(99,120,200,0.15)' }}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium w-12 text-right" style={{ color: colors[strength] }}>
        {labels[strength]}
      </span>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const errorRef = useRef<string>('')

  useEffect(() => {
    if (error && error !== errorRef.current) {
      errorRef.current = error
      setShake(false)
      requestAnimationFrame(() => setShake(true))
    }
  }, [error])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed. Please try again.'); return }
      router.push('/login?registered=1')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#ffffff' }}>

      {/* Form side */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-16">
        <div className="w-full max-w-[360px]">

          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
            >
              <FlaskConical className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
              softAssert
            </span>
          </Link>

          <h1 className="text-[22px] font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
            Create your account
          </h1>
          <p className="text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
            Free plan. No credit card required.
          </p>

          {error && (
            <div
              className={`flex items-center gap-2.5 text-sm rounded px-4 py-3 mb-5 ${shake ? 'animate-shake' : ''}`}
              style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.18)', color: '#b91c1c' }}
              onAnimationEnd={() => setShake(false)}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              id="name"
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              autoComplete="name"
              required
            />

            <InputField
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />

            <div>
              <InputField
                id="password"
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <PasswordStrength password={password} />
            </div>

            <div className="pt-0.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[42px] flex items-center justify-center gap-2 text-sm font-semibold text-white rounded transition-all disabled:opacity-50 hover:-translate-y-px"
                style={{
                  background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow: '0 1px 8px rgba(37,99,235,0.3)',
                }}
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account…
                  </>
                ) : (
                  <>Create free account <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium hover:underline" style={{ color: '#2563eb' }}>
              Sign in
            </Link>
          </p>

          <p className="mt-10 text-xs text-center leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            By creating an account you agree to our{' '}
            <Link href="/terms" className="underline hover:opacity-75 transition-opacity">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline hover:opacity-75 transition-opacity">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* Info panel — desktop only */}
      <div
        className="hidden lg:flex flex-col justify-center shrink-0 px-14 py-16"
        style={{
          width: 420,
          background: '#f7f8fa',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-6" style={{ color: '#2563eb' }}>
          Free plan includes
        </p>

        <h2 className="text-[26px] font-bold leading-snug mb-4" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Everything you need to ship quality software.
        </h2>

        <p className="text-sm leading-relaxed mb-10" style={{ color: 'var(--text-secondary)' }}>
          Start building test suites today — no setup required, no credit card. Upgrade whenever your team is ready.
        </p>

        <div className="space-y-4">
          {PERKS.map((perk) => (
            <div key={perk} className="flex items-start gap-3">
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}
              >
                <Check className="h-3 w-3" style={{ color: '#2563eb' }} />
            </div>
              <span className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>{perk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
