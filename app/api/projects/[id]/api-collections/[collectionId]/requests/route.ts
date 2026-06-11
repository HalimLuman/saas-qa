import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']).default('GET'),
  url: z.string().default(''),
  headers: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  queryParams: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  body: z.string().optional(),
  bodyType: z.enum(['json', 'form-data', 'binary', 'none']).optional(),
  auth: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId, collectionId } = await params
  const collection = await db.apiCollection.findFirst({
    where: { id: collectionId, projectId, project: { userId: session.user.id } },
  })
  if (!collection) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    const maxOrder = await db.apiRequest.aggregate({ where: { collectionId }, _max: { sortOrder: true } })
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1

    const req = await db.apiRequest.create({
      data: {
        collectionId,
        name: data.name,
        method: data.method,
        url: data.url,
        headers: data.headers ? JSON.stringify(data.headers) : null,
        queryParams: data.queryParams ? JSON.stringify(data.queryParams) : null,
        body: data.body ?? null,
        bodyType: data.bodyType ?? null,
        auth: data.auth ? JSON.stringify(data.auth) : null,
        sortOrder,
      },
      include: { assertions: true },
    })
    return Response.json({ request: req }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
