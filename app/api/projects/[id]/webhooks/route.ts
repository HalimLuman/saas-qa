import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { planAllows, planRequiredResponse } from '@/lib/limits'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  platform: z.enum(['SLACK', 'DISCORD', 'CUSTOM']).default('CUSTOM'),
  events: z.array(z.string()).min(1),
  headers: z.record(z.string(), z.string()).optional(),
  secret: z.string().optional(),
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

  const webhooks = await db.webhookIntegration.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json({ webhooks })
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
  if (!planAllows(userPlan?.plan ?? 'FREE', 'webhooks')) {
    return planRequiredResponse('webhooks', 'PRO')
  }

  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    const webhook = await db.webhookIntegration.create({
      data: {
        projectId,
        name: data.name,
        url: data.url,
        platform: data.platform,
        events: JSON.stringify(data.events),
        headers: data.headers ? JSON.stringify(data.headers) : null,
        secret: data.secret ?? null,
      },
    })
    return Response.json({ webhook }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
