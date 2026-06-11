import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  platform: z.enum(['SLACK', 'DISCORD', 'CUSTOM']).optional(),
  events: z.array(z.string()).min(1).optional(),
  headers: z.record(z.string(), z.string()).nullable().optional(),
  secret: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

async function getWebhook(projectId: string, webhookId: string, userId: string) {
  return db.webhookIntegration.findFirst({
    where: { id: webhookId, projectId, project: { userId } },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId, webhookId } = await params
  const webhook = await getWebhook(projectId, webhookId, session.user.id)
  if (!webhook) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.url !== undefined) updateData.url = data.url
    if (data.platform !== undefined) updateData.platform = data.platform
    if (data.events !== undefined) updateData.events = JSON.stringify(data.events)
    if (data.headers !== undefined) updateData.headers = data.headers ? JSON.stringify(data.headers) : null
    if (data.secret !== undefined) updateData.secret = data.secret
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const updated = await db.webhookIntegration.update({ where: { id: webhookId }, data: updateData })
    return Response.json({ webhook: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId, webhookId } = await params
  const webhook = await getWebhook(projectId, webhookId, session.user.id)
  if (!webhook) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.webhookIntegration.delete({ where: { id: webhookId } })
  return Response.json({ success: true })
}
