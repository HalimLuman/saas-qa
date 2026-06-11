'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

const SUBJECTS = [
  'General question',
  'Sales / pricing',
  'Technical support',
  'Bug report',
  'Feature request',
  'Partnership',
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '2.75rem',
  padding: '0 0.875rem',
  borderRadius: '0.625rem',
  fontSize: '0.875rem',
  color: '#0f172a',
  background: '#ffffff',
  border: '1px solid rgba(99,120,200,0.2)',
  outline: 'none',
  transition: 'border-color 150ms, box-shadow 150ms',
}

export function ContactForm() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [message, setMessage] = useState('')
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    // Simulate submit — wire up to /api/feedback or email service in production
    await new Promise((r) => setTimeout(r, 1200))
    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-2xl p-10 flex flex-col items-center text-center"
        style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.14)', boxShadow: '0 2px 16px rgba(99,120,200,0.08)' }}
      >
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <CheckCircle2 className="h-7 w-7" style={{ color: '#059669' }} />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>Message sent!</h3>
        <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
          We typically reply within one business day. Check your inbox at <strong style={{ color: '#0f172a' }}>{email}</strong>.
        </p>
        <button
          className="mt-8 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ background: '#f8faff', border: '1px solid rgba(99,120,200,0.2)', color: '#475569' }}
          onClick={() => { setStatus('idle'); setName(''); setEmail(''); setMessage('') }}
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-7 space-y-5"
      style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.14)', boxShadow: '0 2px 16px rgba(99,120,200,0.08)' }}
    >
      {status === 'error' && (
        <div
          className="flex items-center gap-2.5 text-sm rounded-xl px-3.5 py-2.5"
          style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          Something went wrong. Please try again.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your name" id="cf-name">
          <input
            id="cf-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            required
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(37,99,235,0.5)'
              e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(99,120,200,0.2)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </Field>
        <Field label="Email address" id="cf-email">
          <input
            id="cf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(37,99,235,0.5)'
              e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(99,120,200,0.2)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </Field>
      </div>

      <Field label="Subject" id="cf-subject">
        <select
          id="cf-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{ ...inputStyle, paddingRight: '2rem', cursor: 'pointer', appearance: 'none' }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(37,99,235,0.5)'
            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(99,120,200,0.2)'
            e.target.style.boxShadow = 'none'
          }}
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <Field label="Message" id="cf-message">
        <textarea
          id="cf-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us how we can help…"
          required
          rows={5}
          style={{
            ...inputStyle,
            height: 'auto',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            lineHeight: '1.6',
            resize: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(37,99,235,0.5)'
            e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.08)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(99,120,200,0.2)'
            e.target.style.boxShadow = 'none'
          }}
        />
      </Field>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all"
        style={{
          height: '2.75rem',
          background: status === 'loading' ? 'rgba(29,78,216,0.7)' : 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
          boxShadow: '0 4px 14px rgba(29,78,216,0.25)',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          border: 'none',
        }}
      >
        {status === 'loading' ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending…
          </span>
        ) : (
          <>Send message <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
    </form>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium" style={{ color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}
