import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const assertionSchema = z.object({
  type: z.enum(['status', 'jsonpath', 'header', 'response_time', 'schema', 'regex']),
  target: z.string().min(1),
  operator: z.enum(['eq', 'ne', 'lt', 'gt', 'contains', 'matches', 'exists']),
  value: z.string().nullable().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId } = await params
  const req = await db.apiRequest.findFirst({
    where: { id: requestId, collection: { project: { userId: session.user.id } } },
  })
  if (!req) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = assertionSchema.parse(body)

    const maxOrder = await db.apiAssertion.aggregate({ where: { requestId }, _max: { sortOrder: true } })
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1

    const assertion = await db.apiAssertion.create({
      data: { requestId, ...data, value: data.value ?? null, sortOrder },
    })
    return Response.json({ assertion }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
