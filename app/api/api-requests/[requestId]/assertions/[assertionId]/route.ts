import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const updateSchema = z.object({
  type: z.enum(['status', 'jsonpath', 'header', 'response_time', 'schema', 'regex']).optional(),
  target: z.string().min(1).optional(),
  operator: z.enum(['eq', 'ne', 'lt', 'gt', 'contains', 'matches', 'exists']).optional(),
  value: z.string().nullable().optional(),
})

async function getAssertion(requestId: string, assertionId: string, userId: string) {
  return db.apiAssertion.findFirst({
    where: { id: assertionId, requestId, request: { collection: { project: { userId } } } },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string; assertionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId, assertionId } = await params
  const assertion = await getAssertion(requestId, assertionId, session.user.id)
  if (!assertion) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)
    const updated = await db.apiAssertion.update({ where: { id: assertionId }, data })
    return Response.json({ assertion: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ requestId: string; assertionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId, assertionId } = await params
  const assertion = await getAssertion(requestId, assertionId, session.user.id)
  if (!assertion) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.apiAssertion.delete({ where: { id: assertionId } })
  return Response.json({ success: true })
}
