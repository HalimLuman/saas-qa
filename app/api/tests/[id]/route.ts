import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  module: z.string().max(100).optional(),
  preconditions: z.string().optional(),
  steps: z.array(z.string()).optional(),
  expectedResult: z.string().optional(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
  category: z.enum(['FUNCTIONAL', 'NEGATIVE', 'BOUNDARY', 'SECURITY', 'PERFORMANCE', 'ACCESSIBILITY']).optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'DEPRECATED']).optional(),
  isArchived: z.boolean().optional(),
})

async function getTestCase(id: string, userId: string) {
  return db.testCase.findFirst({
    where: { id, project: { userId } },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const testCase = await getTestCase(id, session.user.id)
  if (!testCase) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)
    const updateData: Record<string, unknown> = { ...data }
    if (data.steps) updateData.steps = JSON.stringify(data.steps)

    // snapshot current state before overwriting
    const lastVersion = await db.testCaseVersion.findFirst({
      where: { testCaseId: id },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    })
    await db.testCaseVersion.create({
      data: {
        testCaseId: id,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        title: testCase.title,
        module: testCase.module,
        preconditions: testCase.preconditions,
        steps: testCase.steps,
        expectedResult: testCase.expectedResult,
        priority: testCase.priority,
        category: testCase.category,
        status: testCase.status,
        createdById: session.user.id,
      },
    })

    const updated = await db.testCase.update({ where: { id }, data: updateData })
    return Response.json({ testCase: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const testCase = await getTestCase(id, session.user.id)
  if (!testCase) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.testCase.update({ where: { id }, data: { isArchived: true } })
  return Response.json({ success: true })
}
