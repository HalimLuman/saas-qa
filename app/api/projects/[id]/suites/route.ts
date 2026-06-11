import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const createSuiteSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  testCaseIds: z.array(z.string()),
  cadence: z.enum(['EVERY_PR', 'NIGHTLY', 'WEEKLY', 'MANUAL']).optional(),
  ownerName: z.string().max(100).optional(),
  failThreshold: z.number().int().min(0).max(100).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const suites = await db.regressionSuite.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { testCases: true } },
    },
  })

  return Response.json({ suites })
}

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
    const { name, description, testCaseIds, cadence, ownerName, failThreshold, filters } =
      createSuiteSchema.parse(body)

    const suite = await db.regressionSuite.create({
      data: {
        projectId: id,
        name,
        description,
        cadence: cadence ?? 'MANUAL',
        ownerName: ownerName ?? null,
        failThreshold: failThreshold ?? 95,
        filters: filters ? JSON.stringify(filters) : null,
        testCases: {
          create: testCaseIds.map((testCaseId, idx) => ({
            testCaseId,
            sortOrder: idx,
          })),
        },
      },
      include: {
        _count: { select: { testCases: true } },
      },
    })

    return Response.json({ suite }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
