import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
})

async function getCollection(projectId: string, collectionId: string, userId: string) {
  return db.apiCollection.findFirst({
    where: { id: collectionId, projectId, project: { userId } },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId, collectionId } = await params
  const collection = await getCollection(projectId, collectionId, session.user.id)
  if (!collection) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)
    const updated = await db.apiCollection.update({ where: { id: collectionId }, data })
    return Response.json({ collection: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; collectionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId, collectionId } = await params
  const collection = await getCollection(projectId, collectionId, session.user.id)
  if (!collection) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.apiCollection.delete({ where: { id: collectionId } })
  return Response.json({ success: true })
}
