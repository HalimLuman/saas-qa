import Link from 'next/link'
import { ArrowRight, Clock, Tag } from 'lucide-react'
import { MarketingNav } from '@/components/marketing-nav'
import { MarketingFooter } from '@/components/marketing-footer'
import { BLOG_POSTS } from '@/lib/blog-data'

const CATEGORIES = ['All', 'AI & QA', 'Bug Reporting', 'Test Strategy', 'Tools & Productivity']

export default function BlogPage() {
  const featured = BLOG_POSTS.find((p) => p.featured)
  const rest = BLOG_POSTS.filter((p) => !p.featured)

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
            <Tag className="h-3 w-3" />
            QA insights & best practices
          </div>
          <h1 className="text-[42px] sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight" style={{ color: '#0f172a' }}>
            The softAssert Blog
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: '#475569' }}>
            Practical guides, test strategy, and QA engineering insights — written by engineers who test for a living.
          </p>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-10">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat, i) => (
            <span
              key={cat}
              className="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all"
              style={
                i === 0
                  ? { background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.28)', color: '#1d4ed8' }
                  : { background: '#f8faff', border: '1px solid rgba(99,120,200,0.15)', color: '#64748b' }
              }
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* ── Featured post ── */}
      {featured && (
        <section className="relative z-10 px-6 lg:px-12 pb-12">
          <div className="max-w-5xl mx-auto">
            <Link href={`/blog/${featured.slug}`} className="block group">
              <div
                className="rounded-2xl p-8 sm:p-10 transition-all duration-200 group-hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(139,92,246,0.03) 100%)',
                  border: '1px solid rgba(37,99,235,0.18)',
                  boxShadow: '0 2px 16px rgba(37,99,235,0.06)',
                }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', color: '#1d4ed8' }}
                  >
                    Featured
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: '#f8faff', border: '1px solid rgba(99,120,200,0.15)', color: '#64748b' }}
                  >
                    {featured.category}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight transition-colors" style={{ color: '#0f172a' }}>
                  {featured.title}
                </h2>
                <p className="text-[15px] leading-relaxed mb-6" style={{ color: '#475569' }}>
                  {featured.excerpt}
                </p>

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: featured.author.gradient, color: '#fff' }}
                    >
                      {featured.author.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>{featured.author.name}</div>
                      <div className="text-xs" style={{ color: '#94a3b8' }}>{featured.author.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: '#94a3b8' }}>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {featured.readTime}
                    </span>
                    <span>{featured.publishedAt}</span>
                    <span
                      className="flex items-center gap-1.5 font-semibold"
                      style={{ color: '#2563eb' }}
                    >
                      Read article <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Post grid ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-28">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold mb-6" style={{ color: '#0f172a' }}>All articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                <div
                  className="rounded-2xl p-6 flex flex-col h-full transition-all duration-200 group-hover:-translate-y-1"
                  style={{ background: '#ffffff', border: '1px solid rgba(99,120,200,0.12)', boxShadow: '0 1px 8px rgba(99,120,200,0.06)' }}
                >
                  <div className="mb-4">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: '#f8faff', border: '1px solid rgba(99,120,200,0.15)', color: '#64748b' }}
                    >
                      {post.category}
                    </span>
                  </div>

                  <h3 className="font-bold mb-3 text-[15px] leading-snug flex-1 transition-colors group-hover:text-blue-700" style={{ color: '#0f172a' }}>
                    {post.title}
                  </h3>

                  <p className="text-[13px] leading-relaxed mb-5" style={{ color: '#64748b' }}>
                    {post.excerpt.substring(0, 120)}…
                  </p>

                  <div className="mt-auto">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: post.author.gradient, color: '#fff' }}
                      >
                        {post.author.initials}
                      </div>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: '#0f172a' }}>{post.author.name}</div>
                        <div className="text-[11px]" style={{ color: '#94a3b8' }}>{post.author.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px]" style={{ color: '#94a3b8' }}>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                      <span>{post.publishedAt}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Coming soon card */}
            <div
              className="rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[220px]"
              style={{ background: '#f8faff', border: '1px dashed rgba(99,120,200,0.2)' }}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)' }}
              >
                <Tag className="h-4 w-4" style={{ color: '#2563eb' }} />
              </div>
              <p className="font-semibold text-sm mb-1" style={{ color: '#0f172a' }}>More articles coming</p>
              <p className="text-[12px]" style={{ color: '#94a3b8' }}>
                We publish weekly. Follow us to stay updated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter CTA ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-28">
        <div
          className="max-w-3xl mx-auto rounded-2xl p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', boxShadow: '0 24px 60px -16px rgba(30,58,138,0.35)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 0%, rgba(99,163,255,0.18), transparent 60%)', pointerEvents: 'none' }} />
          <h2 className="text-2xl font-bold text-white mb-3 relative">New to softAssert?</h2>
          <p className="mb-8 relative" style={{ color: 'rgba(226,232,248,0.75)' }}>
            Generate your first test suite for free — no credit card, no setup, under 3 minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all hover:opacity-90 relative"
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
