import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { planAllows, planRequiredResponse } from '@/lib/limits'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  const project = await db.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const collections = await db.apiCollection.findMany({
    where: { projectId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      requests: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: { assertions: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  })
  return Response.json({ collections })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  const project = await db.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const userPlan = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
  if (!planAllows(userPlan?.plan ?? 'FREE', 'apiTesting')) {
    return planRequiredResponse('apiTesting', 'PRO')
  }

  try {
    const body = await request.json()
    const data = createSchema.parse(body)
    const collection = await db.apiCollection.create({
      data: { projectId, name: data.name, description: data.description ?? null },
      include: { requests: { include: { assertions: true } } },
    })
    return Response.json({ collection }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
