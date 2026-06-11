import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  action: z.enum(['set_priority', 'set_area', 'set_status', 'add_to_suite', 'delete']),
  priority: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
  areaId: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'DEPRECATED']).optional(),
  suiteId: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  const project = await db.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const { ids, action, priority, areaId, status, suiteId } = bulkSchema.parse(body)

    // verify all test cases belong to this project
    const count = await db.testCase.count({ where: { id: { in: ids }, projectId } })
    if (count !== ids.length) return Response.json({ error: 'Some test cases not found' }, { status: 404 })

    let affected = 0

    if (action === 'set_priority' && priority) {
      const r = await db.testCase.updateMany({ where: { id: { in: ids }, projectId }, data: { priority } })
      affected = r.count
    } else if (action === 'set_area') {
      const r = await db.testCase.updateMany({ where: { id: { in: ids }, projectId }, data: { areaId: areaId ?? null } })
      affected = r.count
    } else if (action === 'set_status' && status) {
      const r = await db.testCase.updateMany({ where: { id: { in: ids }, projectId }, data: { status } })
      affected = r.count
    } else if (action === 'add_to_suite' && suiteId) {
      const suite = await db.regressionSuite.findFirst({ where: { id: suiteId, projectId } })
      if (!suite) return Response.json({ error: 'Suite not found' }, { status: 404 })

      const existing = await db.suiteTestCase.findMany({
        where: { suiteId, testCaseId: { in: ids } },
        select: { testCaseId: true },
      })
      const existingIds = new Set(existing.map((e) => e.testCaseId))
      const toAdd = ids.filter((id) => !existingIds.has(id))

      const maxOrder = await db.suiteTestCase.aggregate({ where: { suiteId }, _max: { sortOrder: true } })
      let sortOrder = (maxOrder._max.sortOrder ?? -1) + 1

      if (toAdd.length > 0) {
        await db.suiteTestCase.createMany({
          data: toAdd.map((testCaseId) => ({ suiteId, testCaseId, sortOrder: sortOrder++ })),
        })
      }
      affected = toAdd.length
    } else if (action === 'delete') {
      const r = await db.testCase.updateMany({ where: { id: { in: ids }, projectId }, data: { isArchived: true } })
      affected = r.count
    } else {
      return Response.json({ error: 'Invalid action or missing required fields' }, { status: 400 })
    }

    logActivity({
      projectId,
      userId: session.user.id,
      action: `test_case.bulk_${action}`,
      targetType: 'TestCase',
      targetId: projectId,
      metadata: { ids, affected },
    })

    return Response.json({ affected })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
