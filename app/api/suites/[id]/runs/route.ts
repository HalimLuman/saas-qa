import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const suite = await db.regressionSuite.findFirst({
    where: { id, project: { userId: session.user.id } },
    include: { testCases: { select: { testCaseId: true } } },
  })
  if (!suite) return Response.json({ error: 'Not found' }, { status: 404 })

  const name = `Run · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const run = await db.suiteRun.create({
    data: {
      suiteId: id,
      name,
      results: {
        create: suite.testCases.map(({ testCaseId }) => ({ testCaseId, result: 'NOT_RUN' })),
      },
    },
    include: { results: true },
  })

  return Response.json({ run })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const suite = await db.regressionSuite.findFirst({
    where: { id, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!suite) return Response.json({ error: 'Not found' }, { status: 404 })

  const runs = await db.suiteRun.findMany({
    where: { suiteId: id },
    orderBy: { startedAt: 'desc' },
    include: { _count: { select: { results: true } } },
    take: 20,
  })

  return Response.json({ runs })
}
