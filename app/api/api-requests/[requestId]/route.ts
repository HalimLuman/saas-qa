import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).optional(),
  url: z.string().optional(),
  headers: z.array(z.object({ key: z.string(), value: z.string() })).nullable().optional(),
  queryParams: z.array(z.object({ key: z.string(), value: z.string() })).nullable().optional(),
  body: z.string().nullable().optional(),
  bodyType: z.enum(['json', 'form-data', 'binary', 'none']).nullable().optional(),
  auth: z.record(z.string(), z.unknown()).nullable().optional(),
})

async function getRequest(requestId: string, userId: string) {
  return db.apiRequest.findFirst({
    where: { id: requestId, collection: { project: { userId } } },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId } = await params
  const req = await getRequest(requestId, session.user.id)
  if (!req) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.method !== undefined) updateData.method = data.method
    if (data.url !== undefined) updateData.url = data.url
    if (data.headers !== undefined) updateData.headers = data.headers ? JSON.stringify(data.headers) : null
    if (data.queryParams !== undefined) updateData.queryParams = data.queryParams ? JSON.stringify(data.queryParams) : null
    if (data.body !== undefined) updateData.body = data.body
    if (data.bodyType !== undefined) updateData.bodyType = data.bodyType
    if (data.auth !== undefined) updateData.auth = data.auth ? JSON.stringify(data.auth) : null

    const updated = await db.apiRequest.update({
      where: { id: requestId },
      data: updateData,
      include: { assertions: { orderBy: { sortOrder: 'asc' } } },
    })
    return Response.json({ request: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId } = await params
  const req = await getRequest(requestId, session.user.id)
  if (!req) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.apiRequest.delete({ where: { id: requestId } })
  return Response.json({ success: true })
}
