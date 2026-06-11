import { Mail, MessageCircle, Clock, MapPin, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing-nav'
import { MarketingFooter } from '@/components/marketing-footer'
import { ContactForm } from './contact-form'

const CONTACT_OPTIONS = [
  {
    icon: Mail,
    title: 'Email us',
    description: 'For general inquiries and support',
    value: 'halimluman.dev@gmail.com',
    href: 'mailto:halimluman.dev@gmail.com',
    color: '#2563eb',
  },
  {
    icon: MessageCircle,
    title: 'Live chat',
    description: 'Available during business hours',
    value: 'Start a conversation',
    href: '#',
    color: '#7c3aed',
  },
  {
    icon: Clock,
    title: 'Response time',
    description: 'We reply to all messages',
    value: 'Within 1 business day',
    href: null,
    color: '#059669',
  },
]

const FAQS = [
  {
    q: 'What is the best way to report a bug?',
    a: 'Use the contact form with subject "Bug report" and include your browser, OS, and steps to reproduce. Screenshots are always helpful.',
  },
  {
    q: 'Do you offer custom plans for larger teams?',
    a: 'Yes. If you have 20+ users or need custom limits, SSO, or SLAs, reach out via the contact form and we\'ll put together a plan.',
  },
  {
    q: 'Can I request a feature?',
    a: 'Absolutely. Select "Feature request" as the subject. We review every request and frequently ship features suggested by our users.',
  },
  {
    q: 'Where are you based?',
    a: 'softAssert is a remote-first team. Our support hours are 9am–6pm UTC, Monday through Friday.',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute rounded-full" style={{ top: '-10%', right: '-6%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ bottom: '10%', left: '-8%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 65%)' }} />
      </div>

      <MarketingNav variant="light" />

      {/* ── Hero ── */}
      <section className="relative z-10 px-6 lg:px-12 pt-20 pb-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#1d4ed8' }}
          >
            <MessageCircle className="h-3 w-3" />
            We&apos;d love to hear from you
          </div>
          <h1 className="text-[42px] sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight" style={{ color: '#0f172a' }}>
            Get in touch
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: '#475569' }}>
            Questions about pricing, feature requests, or just want to say hello — we reply to every message.
          </p>
        </div>
      </section>

      {/* ── Contact options ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CONTACT_OPTIONS.map((opt) => (
            <div
              key={opt.title}
              className="rounded-2xl p-6"
              style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.12)', boxShadow: '0 1px 8px rgba(99,120,200,0.06)' }}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${opt.color}10`, border: `1px solid ${opt.color}25` }}
              >
                <opt.icon className="h-5 w-5" style={{ color: opt.color }} />
              </div>
              <h3 className="font-bold mb-1" style={{ color: '#0f172a' }}>{opt.title}</h3>
              <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>{opt.description}</p>
              {opt.href ? (
                <a
                  href={opt.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                  style={{ color: opt.color }}
                >
                  {opt.value} <ChevronRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="text-sm font-medium" style={{ color: opt.color }}>{opt.value}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Form + FAQ ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Form */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#0f172a' }}>Send us a message</h2>
            <ContactForm />
          </div>

          {/* FAQ sidebar */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#0f172a' }}>Common questions</h2>
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl p-5"
                  style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.12)', boxShadow: '0 1px 6px rgba(99,120,200,0.05)' }}
                >
                  <h3 className="font-semibold mb-2 text-sm" style={{ color: '#0f172a' }}>{faq.q}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: '#64748b' }}>{faq.a}</p>
                </div>
              ))}

              <div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.14)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" style={{ color: '#2563eb' }} />
                  <span className="font-semibold text-sm" style={{ color: '#0f172a' }}>Support hours</span>
                </div>
                <p className="text-[13px]" style={{ color: '#64748b' }}>
                  Mon–Fri, 9am–6pm UTC.<br />
                  We aim to reply within 24 hours.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm mb-3" style={{ color: '#94a3b8' }}>Looking for something else?</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'About us', href: '/about' },
                  { label: 'Blog', href: '/blog' },
                  { label: 'Privacy', href: '/privacy' },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: '#f8faff',
                      border: '1px solid rgba(99,120,200,0.15)',
                      color: '#64748b',
                    }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter variant="light" />
    </div>
  )
}
