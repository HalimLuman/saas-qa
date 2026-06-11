'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FlaskConical, Menu, X, ChevronRight } from 'lucide-react'

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

interface MarketingNavProps {
  variant?: 'dark' | 'light'
}

export function MarketingNav({ variant = 'dark' }: MarketingNavProps) {
  const [open, setOpen] = useState(false)
  const isLight = variant === 'light'

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: isLight ? 'rgba(248,250,255,0.82)' : 'rgba(6,13,31,0.9)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: isLight
          ? '1px solid rgba(99,120,200,0.12)'
          : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 0 16px rgba(59,130,246,0.45)',
            }}
          >
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          <span
            className="font-bold text-[16px] tracking-tight"
            style={{ color: isLight ? '#0f172a' : '#ffffff' }}
          >
            softAssert
          </span>
        </Link>

        {/* Center links — desktop */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm px-4 py-2 rounded-lg transition-colors"
              style={{ color: isLight ? 'rgba(71,85,105,0.85)' : 'rgba(203,213,225,0.6)' }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* CTA — desktop */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: isLight ? 'rgba(71,85,105,0.9)' : 'rgba(203,213,225,0.75)' }}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
              boxShadow: '0 4px 14px rgba(29,78,216,0.30), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            Start free
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: isLight ? '#475569' : 'rgba(203,213,225,0.8)' }}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden px-6 pb-5 pt-3"
          style={{
            borderTop: isLight
              ? '1px solid rgba(99,120,200,0.1)'
              : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="space-y-0.5 mb-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block text-sm px-3 py-2.5 rounded-lg transition-colors"
                style={{ color: isLight ? '#475569' : 'rgba(203,213,225,0.75)' }}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="space-y-2">
            <Link
              href="/login"
              className="block text-center text-sm font-medium py-2.5 rounded-xl transition-colors"
              style={{
                color: isLight ? '#475569' : 'rgba(203,213,225,0.8)',
                border: isLight
                  ? '1px solid rgba(99,120,200,0.2)'
                  : '1px solid rgba(255,255,255,0.1)',
              }}
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="block text-center text-sm font-semibold py-2.5 rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)' }}
              onClick={() => setOpen(false)}
            >
              Start free
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
