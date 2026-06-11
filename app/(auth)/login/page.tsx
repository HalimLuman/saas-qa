'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FlaskConical, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight } from 'lucide-react'

function InputField({
  id, label, type, value, onChange, placeholder, autoComplete, required,
  right,
}: {
  id: string; label: string; type: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string; autoComplete: string; required?: boolean
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

function PasswordField({
  id, value, onChange, showPass, onToggle, autoComplete,
}: {
  id: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  showPass: boolean; onToggle: () => void; autoComplete: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          Password
        </label>
        <span className="text-xs cursor-pointer hover:underline" style={{ color: 'var(--text-tertiary)' }}>
          Forgot password?
        </span>
      </div>
      <div className="relative">
        <input
          id={id}
          type={showPass ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          required
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full h-[42px] text-sm rounded transition-all"
          style={{
            paddingLeft: '0.875rem',
            paddingRight: '2.5rem',
            color: 'var(--text-primary)',
            background: '#ffffff',
            border: `1px solid ${focused ? 'rgba(37,99,235,0.55)' : 'var(--border)'}`,
            boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)
  const errorRef = useRef<string>('')

  useEffect(() => { if (params.get('registered') === '1') setJustRegistered(true) }, [params])
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
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) setError('Invalid email or password.')
      else { router.push('/dashboard'); router.refresh() }
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
            Welcome back
          </h1>
          <p className="text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
            Sign in to continue to your workspace.
          </p>

          {justRegistered && (
            <div
              className="flex items-center gap-2.5 text-sm rounded px-4 py-3 mb-5"
              style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', color: '#15803d' }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Account created — sign in to get started.
            </div>
          )}

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
              id="login-email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />

            <PasswordField
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPass={showPass}
              onToggle={() => setShowPass(!showPass)}
              autoComplete="current-password"
            />

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
                    Signing in…
                  </>
                ) : (
                  <>Sign in <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium hover:underline" style={{ color: '#2563eb' }}>
              Create one free
            </Link>
          </p>

          <p className="mt-10 text-xs text-center leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            By signing in you agree to our{' '}
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
          QA Intelligence
        </p>

        <h2 className="text-[26px] font-bold leading-snug mb-4" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          The fastest way to build solid test coverage.
        </h2>

        <p className="text-sm leading-relaxed mb-10" style={{ color: 'var(--text-secondary)' }}>
          Describe a feature in plain English. Get a structured test suite in under a minute — then run, track, and report without leaving the tool.
        </p>

        <div className="space-y-6">
          {([
            { val: '10×', label: 'faster QA cycles' },
            { val: '500+', label: 'teams onboard' },
            { val: '<3 min', label: 'to first test suite' },
          ] as const).map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold" style={{ color: '#1d4ed8' }}>{s.val}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
