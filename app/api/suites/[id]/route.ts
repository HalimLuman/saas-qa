import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const suite = await db.regressionSuite.findFirst({
    where: { id, project: { userId: session.user.id } },
    include: {
      testCases: {
        orderBy: { sortOrder: 'asc' },
        include: { testCase: true },
      },
    },
  })

  if (!suite) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ suite })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const suite = await db.regressionSuite.findFirst({
    where: { id, project: { userId: session.user.id } },
  })
  if (!suite) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, description, cadence, ownerName, failThreshold, testCaseIds } = body

  const updated = await db.regressionSuite.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(cadence !== undefined && { cadence }),
      ...(ownerName !== undefined && { ownerName: ownerName || null }),
      ...(failThreshold !== undefined && { failThreshold }),
    },
  })

  if (Array.isArray(testCaseIds)) {
    await db.suiteTestCase.deleteMany({ where: { suiteId: id } })
    if (testCaseIds.length > 0) {
      await db.suiteTestCase.createMany({
        data: testCaseIds.map((tcId: string, idx: number) => ({
          suiteId: id,
          testCaseId: tcId,
          sortOrder: idx,
        })),
      })
    }
  }

  return Response.json({ suite: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const suite = await db.regressionSuite.findFirst({
    where: { id, project: { userId: session.user.id } },
  })

  if (!suite) return Response.json({ error: 'Not found' }, { status: 404 })
  await db.regressionSuite.delete({ where: { id } })
  return Response.json({ success: true })
}
