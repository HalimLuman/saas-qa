import Link from 'next/link'
import { FlaskConical, Twitter, Github, Linkedin } from '@/components/social-icons'

const COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'AI Studio', href: '/#features' },
      { label: 'API Testing', href: '/#features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Changelog', href: '/blog' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'API Reference', href: '#' },
      { label: 'Integrations', href: '#' },
      { label: 'Best practices', href: '#' },
      { label: 'QA glossary', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'DPA', href: '#' },
      { label: 'SOC 2', href: '#' },
      { label: 'SLA', href: '#' },
    ],
  },
]

const SOCIALS = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
]

interface MarketingFooterProps {
  variant?: 'dark' | 'light'
}

export function MarketingFooter({ variant = 'dark' }: MarketingFooterProps) {
  const isLight = variant === 'light'

  return (
    <footer
      className="relative z-10"
      style={{
        background: isLight ? 'rgba(255,255,255,0.7)' : undefined,
        backdropFilter: isLight ? 'blur(12px)' : undefined,
        WebkitBackdropFilter: isLight ? 'blur(12px)' : undefined,
        borderTop: isLight
          ? '1px solid rgba(99,120,200,0.12)'
          : '1px solid rgba(255,255,255,0.07)',
        marginTop: isLight ? 0 : undefined,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-16 pb-10">
        <div
          className="gap-10 mb-14"
          style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr' }}
        >
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
              >
                <FlaskConical className="h-3.5 w-3.5 text-white" />
              </div>
              <span
                className="font-bold text-[15px] tracking-tight"
                style={{ color: isLight ? '#0f172a' : '#ffffff' }}
              >
                softAssert
              </span>
            </Link>
            <p
              className="text-[13.5px] leading-relaxed mb-6"
              style={{ color: isLight ? '#94a3b8' : 'rgba(100,116,139,0.8)', maxWidth: '38ch' }}
            >
              The AI-native QA platform — test cases, bug tracking, suite runs, and AI generation in one workspace. Built for engineers who care about quality.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.05)',
                    border: isLight
                      ? '1px solid rgba(99,120,200,0.2)'
                      : '1px solid rgba(255,255,255,0.09)',
                    color: isLight ? '#64748b' : 'rgba(148,163,184,0.7)',
                  }}
                >
                  <s.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.heading}>
              <h3
                className="text-[13px] font-semibold mb-4"
                style={{ color: isLight ? '#0f172a' : 'rgba(100,116,139,0.55)' }}
              >
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13.5px] transition-colors"
                      style={{ color: isLight ? '#64748b' : 'rgba(148,163,184,0.7)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{
            borderTop: isLight
              ? '1px solid rgba(99,120,200,0.12)'
              : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p
            className="text-[12.5px]"
            style={{ color: isLight ? '#94a3b8' : 'rgba(100,116,139,0.5)' }}
          >
            © 2026 softAssert, Inc.
          </p>
          <div
            className="flex items-center gap-1.5 text-[12.5px]"
            style={{ color: isLight ? '#94a3b8' : 'rgba(100,116,139,0.5)' }}
          >
            <span
              className="w-[7px] h-[7px] rounded-full inline-block"
              style={{ background: '#16a34a', boxShadow: '0 0 0 2px rgba(22,163,74,0.18)' }}
            />
            All systems operational
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
              { label: 'Cookies', href: '#' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[12.5px] transition-colors"
                style={{ color: isLight ? '#94a3b8' : 'rgba(100,116,139,0.5)' }}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <span
            className="text-[12px]"
            style={{
              color: isLight ? '#94a3b8' : 'rgba(100,116,139,0.5)',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            v 4.12.0
          </span>
        </div>
      </div>
    </footer>
  )
}
