import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const schema = z.object({
  result: z.enum(['NOT_RUN', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED']),
  notes: z.string().max(500).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string; testCaseId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, runId, testCaseId } = await params

  const run = await db.suiteRun.findFirst({
    where: { id: runId, suite: { id, project: { userId: session.user.id } } },
    select: { id: true, status: true },
  })
  if (!run) return Response.json({ error: 'Not found' }, { status: 404 })
  if (run.status === 'COMPLETED') return Response.json({ error: 'Run is already completed' }, { status: 400 })

  const body = schema.parse(await request.json())

  const updated = await db.suiteRunResult.update({
    where: { runId_testCaseId: { runId, testCaseId } },
    data: { result: body.result, notes: body.notes ?? null },
  })

  return Response.json({ result: updated })
}
