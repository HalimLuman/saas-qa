import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft, History, Sparkles, RotateCcw } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function GenerationHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  })
  if (!project) notFound()

  const sessions = await db.generationSession.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">

      {/* Back link */}
      <Link
        href={`/project/${id}/generate`}
        className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity opacity-60 hover:opacity-100"
        style={{ color: 'var(--text-primary)' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Generate
      </Link>

      {/* Page header card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface-0)',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #4f46e5 50%, #3b82f6 100%)' }} />
        <div className="px-6 py-5 flex items-center gap-4">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)', border: '1px solid #e9d5ff' }}
          >
            <History className="h-5 w-5" style={{ color: '#7c3aed' }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.025em' }}
            >
              Generation History
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {project.name} · {sessions.length} generation{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {sessions.length === 0 ? (
        <div
          className="rounded-2xl flex flex-col items-center py-16 px-6 text-center"
          style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
        >
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-2)' }}
          >
            <History className="h-7 w-7" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            No generations yet
          </p>
          <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-tertiary)' }}>
            Generate your first test cases to see history here.
          </p>
          <Link
            href={`/project/${id}/generate`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
          >
            <Sparkles className="h-4 w-4" />
            Generate Test Cases
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            let cases: unknown[] = []
            try { cases = JSON.parse(s.outputCases); if (!Array.isArray(cases)) cases = [] } catch { cases = [] }

            let saved: string[] = []
            try { saved = JSON.parse(s.savedCaseIds); if (!Array.isArray(saved)) saved = [] } catch { saved = [] }

            return (
              <div
                key={s.id}
                className="rounded-xl p-4 space-y-3 transition-all"
                style={{
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    className="text-sm line-clamp-2 flex-1 leading-relaxed"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {s.inputText}
                  </p>
                  <span
                    className="text-xs shrink-0 mt-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {formatDate(s.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Generated count */}
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, #f3e8ff, #ede9fe)',
                      color: '#7c3aed',
                      border: '1px solid #e9d5ff',
                    }}
                  >
                    <Sparkles className="h-3 w-3" />
                    {cases.length} generated
                  </span>

                  {/* Saved count */}
                  {saved.length > 0 && (
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-lg"
                      style={{
                        background: '#f0fdf4',
                        color: '#16a34a',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      {saved.length} saved
                    </span>
                  )}

                  {/* Filter type */}
                  {s.filterType && (
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg capitalize"
                      style={{
                        background: 'var(--surface-1)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {s.filterType}
                    </span>
                  )}

                  {/* Re-run link */}
                  <Link
                    href={`/project/${id}/generate?replay=${s.id}`}
                    className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    onMouseEnter={() => {}}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Re-run
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
