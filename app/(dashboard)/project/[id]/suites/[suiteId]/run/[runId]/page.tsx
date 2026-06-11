import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import RunExecutionClient from './run-execution-client'

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string; suiteId: string; runId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id, suiteId, runId } = await params

  const run = await db.suiteRun.findFirst({
    where: { id: runId, suite: { id: suiteId, project: { id, userId: session.user.id } } },
    include: {
      suite: { select: { name: true, project: { select: { name: true } } } },
      results: {
        include: { testCase: { select: { id: true, title: true, priority: true, module: true, preconditions: true, steps: true, expectedResult: true } } },
        orderBy: { testCase: { title: 'asc' } },
      },
    },
  })

  if (!run) notFound()

  return (
    <div className="animate-fade-up">
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-tertiary)', marginBottom: 18, flexWrap: 'wrap' }}>
        <Link href={`/project/${id}`} style={{ color: 'var(--text-tertiary)' }} className="hover-underline">
          {run.suite.project.name}
        </Link>
        <span>›</span>
        <Link href={`/project/${id}/suites`} style={{ color: 'var(--text-tertiary)' }} className="hover-underline">
          Suites
        </Link>
        <span>›</span>
        <Link href={`/project/${id}/suites/${suiteId}`} style={{ color: 'var(--text-tertiary)' }} className="hover-underline">
          {run.suite.name}
        </Link>
        <span>›</span>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Run</span>
      </nav>

      <RunExecutionClient
        runId={runId}
        suiteId={suiteId}
        projectId={id}
        suiteName={run.suite.name}
        startedAt={run.startedAt}
        initialResults={run.results.map((r) => ({
          testCaseId: r.testCaseId,
          result: r.result,
          notes: r.notes ?? '',
          autoLog: r.autoLog ? (JSON.parse(r.autoLog) as { action: string; status: 'ok' | 'error' | 'info'; error?: string }[]) : null,
          autoStatus: r.autoStatus ?? null,
          screenshot: r.screenshot ?? null,
          testCase: r.testCase,
        }))}
        initialStatus={run.status}
      />
    </div>
  )
}
