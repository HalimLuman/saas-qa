import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { dispatchWebhooks } from '@/lib/webhooks'

// PATCH /api/suites/[id]/runs/[runId] — complete the run
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, runId } = await params
  const run = await db.suiteRun.findFirst({
    where: { id: runId, suite: { id, project: { userId: session.user.id } } },
    include: {
      suite: { select: { name: true, projectId: true } },
      results: { select: { result: true } },
    },
  })
  if (!run) return Response.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.suiteRun.update({
    where: { id: runId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  })

  // tally results for webhook payload
  const tally = { passed: 0, failed: 0, blocked: 0, skipped: 0 }
  for (const r of run.results) {
    if (r.result === 'PASSED') tally.passed++
    else if (r.result === 'FAILED') tally.failed++
    else if (r.result === 'BLOCKED') tally.blocked++
    else if (r.result === 'SKIPPED') tally.skipped++
  }
  const event = tally.failed > 0 ? 'run.failed' : 'run.completed'
  dispatchWebhooks(run.suite.projectId, event, {
    runId,
    suiteName: run.suite.name,
    ...tally,
  }).catch(() => { /* fire-and-forget */ })

  return Response.json({ run: updated })
}

// GET /api/suites/[id]/runs/[runId] — get run with results
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, runId } = await params
  const run = await db.suiteRun.findFirst({
    where: { id: runId, suite: { id, project: { userId: session.user.id } } },
    include: {
      results: {
        include: { testCase: { select: { id: true, title: true, priority: true, module: true } } },
        orderBy: { testCase: { title: 'asc' } },
      },
    },
  })
  if (!run) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ run })
}
