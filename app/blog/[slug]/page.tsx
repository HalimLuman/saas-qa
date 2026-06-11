import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import { MarketingNav } from '@/components/marketing-nav'
import { MarketingFooter } from '@/components/marketing-footer'
import { getPostBySlug, getAllSlugs } from '@/lib/blog-data'

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

// ── Inline formatter ──────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#0f172a', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded text-[13px] font-mono"
          style={{ background: 'rgba(37,99,235,0.07)', color: '#2563eb', border: '1px solid rgba(37,99,235,0.15)' }}
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ── Block parser ──────────────────────────────────────────────────────────────
type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'hr' }
  | { type: 'code'; content: string }
  | { type: 'table'; rows: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'p'; text: string }

function parseContent(content: string): Block[] {
  const lines = content.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', content: code.join('\n') })
      i++
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) })
      i++
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) })
      i++
      continue
    }

    if (line.trim() === '---') {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    if (line.startsWith('|')) {
      const rows: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i])
        i++
      }
      blocks.push({ type: 'table', rows })
      continue
    }

    if (line.startsWith('- ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    if (line.trim() === '') {
      i++
      continue
    }

    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      lines[i].trim() !== '---' &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('|') &&
      !lines[i].startsWith('- ') &&
      !/^\d+\. /.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'p', text: paraLines.join(' ') })
    }
  }

  return blocks
}

// ── Block renderer ────────────────────────────────────────────────────────────
function renderBlock(block: Block, idx: number): React.ReactNode {
  switch (block.type) {
    case 'h2':
      return (
        <h2
          key={idx}
          className="text-2xl font-bold mt-12 mb-4 first:mt-0"
          style={{ color: '#0f172a', letterSpacing: '-0.02em' }}
        >
          {renderInline(block.text)}
        </h2>
      )

    case 'h3':
      return (
        <h3
          key={idx}
          className="text-lg font-bold mt-8 mb-3"
          style={{ color: '#0f172a' }}
        >
          {renderInline(block.text)}
        </h3>
      )

    case 'hr':
      return (
        <hr
          key={idx}
          className="my-10"
          style={{ border: 'none', borderTop: '1px solid rgba(99,120,200,0.15)' }}
        />
      )

    case 'code':
      return (
        <pre
          key={idx}
          className="rounded-xl p-5 my-6 text-[13px] font-mono leading-relaxed overflow-x-auto"
          style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(99,120,200,0.1)' }}
        >
          <code>{block.content}</code>
        </pre>
      )

    case 'table': {
      const headerRow = block.rows[0]
      // row 1 is the separator (| --- | --- |)
      const dataRows = block.rows.slice(2)
      const parseRow = (r: string) =>
        r.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map((c) => c.trim())

      const headers = parseRow(headerRow)
      const data = dataRows.map(parseRow)

      return (
        <div key={idx} className="my-7 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {headers.map((h, j) => (
                  <th
                    key={j}
                    className="text-left px-4 py-2.5 font-semibold"
                    style={{ background: 'rgba(37,99,235,0.06)', color: '#1e40af', borderBottom: '1px solid rgba(37,99,235,0.15)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid rgba(99,120,200,0.1)' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5" style={{ color: '#475569' }}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    case 'ul':
      return (
        <ul key={idx} className="my-5 space-y-2 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-[15px] leading-relaxed" style={{ color: '#475569' }}>
              <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: '#3b82f6' }} />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol key={idx} className="my-5 space-y-2 pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-[15px] leading-relaxed" style={{ color: '#475569' }}>
              <span
                className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5"
                style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}
              >
                {j + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )

    case 'p':
      return (
        <p key={idx} className="text-[15px] leading-[1.8] my-5" style={{ color: '#475569' }}>
          {renderInline(block.text)}
        </p>
      )

    default:
      return null
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const blocks = parseContent(post.content)

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute rounded-full"
          style={{ top: '-10%', right: '-6%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%)' }}
        />
      </div>

      <MarketingNav variant="light" />

      {/* ── Article header ── */}
      <header className="relative z-10 px-6 lg:px-12 pt-16 pb-12">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors hover:text-blue-700"
            style={{ color: '#64748b' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to blog
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#1d4ed8' }}
            >
              {post.category}
            </span>
            {post.featured && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669' }}
              >
                Featured
              </span>
            )}
          </div>

          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-5 leading-tight"
            style={{ color: '#0f172a', letterSpacing: '-0.025em' }}
          >
            {post.title}
          </h1>

          <p className="text-lg leading-relaxed mb-8" style={{ color: '#64748b' }}>
            {post.excerpt}
          </p>

          <div
            className="flex items-center justify-between flex-wrap gap-5 pt-6"
            style={{ borderTop: '1px solid rgba(99,120,200,0.12)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: post.author.gradient, color: '#fff' }}
              >
                {post.author.initials}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>{post.author.name}</div>
                <div className="text-xs" style={{ color: '#94a3b8' }}>{post.author.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs" style={{ color: '#94a3b8' }}>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {post.publishedAt}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Article body ── */}
      <article className="relative z-10 px-6 lg:px-12 pb-20">
        <div className="max-w-3xl mx-auto">
          {blocks.map((block, i) => renderBlock(block, i))}
        </div>
      </article>

      {/* ── CTA ── */}
      <section className="relative z-10 px-6 lg:px-12 pb-28">
        <div
          className="max-w-3xl mx-auto rounded-2xl p-10 text-center"
          style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', boxShadow: '0 24px 60px -16px rgba(30,58,138,0.35)', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 0%, rgba(99,163,255,0.18), transparent 60%)', pointerEvents: 'none' }} />
          <h2 className="text-2xl font-bold text-white mb-3 relative">Try softAssert free</h2>
          <p className="mb-8 relative" style={{ color: 'rgba(226,232,248,0.75)' }}>
            Generate test cases, file bugs, and run regression suites — no credit card needed.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all hover:opacity-90 relative"
            style={{ background: '#ffffff', color: '#1e3a8a', boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
          >
            Get started free <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </section>

      <MarketingFooter variant="light" />
    </div>
  )
}
