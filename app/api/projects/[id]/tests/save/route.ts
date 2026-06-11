import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'

const testCaseSchema = z.object({
  title: z.string().min(1).max(500),
  module: z.string().max(100).optional(),
  preconditions: z.string().optional(),
  steps: z.array(z.string()),
  expectedResult: z.string(),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']),
  category: z.enum(['FUNCTIONAL', 'NEGATIVE', 'BOUNDARY', 'SECURITY', 'PERFORMANCE', 'ACCESSIBILITY']),
})

const saveSchema = z.object({
  testCases: z.array(testCaseSchema),
  module: z.string().max(100).optional(),
  areaId: z.string().optional(),
  sourceType: z.enum(['AI_GENERATED', 'MANUAL', 'FROM_RECORDING']).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const { testCases, module, areaId, sourceType } = saveSchema.parse(body)

    const saved = await db.testCase.createMany({
      data: testCases.map((tc) => ({
        projectId: id,
        areaId: areaId ?? null,
        title: tc.title,
        module: tc.module || module || null,
        preconditions: tc.preconditions || null,
        steps: JSON.stringify(tc.steps),
        expectedResult: tc.expectedResult,
        priority: tc.priority,
        category: tc.category,
        sourceType: sourceType ?? 'AI_GENERATED',
      })),
    })

    logActivity({ projectId: id, userId: session.user.id, action: 'test_case.batch_created', targetType: 'TestCase', targetId: id, metadata: { count: saved.count } })

    return Response.json({ saved: saved.count }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
