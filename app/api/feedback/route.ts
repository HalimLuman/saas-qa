import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const schema = z.object({
  generationId: z.string(),
  testCaseIndex: z.number().int().min(0),
  rating: z.enum(['POSITIVE', 'NEGATIVE']),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = schema.parse(await request.json())

  const gen = await db.generationSession.findFirst({
    where: { id: body.generationId, userId: session.user.id },
    select: { id: true },
  })
  if (!gen) return Response.json({ error: 'Not found' }, { status: 404 })

  const existing = await db.aiFeedback.findFirst({
    where: { userId: session.user.id, generationId: body.generationId, testCaseIndex: body.testCaseIndex },
  })

  const feedback = existing
    ? await db.aiFeedback.update({ where: { id: existing.id }, data: { rating: body.rating } })
    : await db.aiFeedback.create({
        data: {
          userId: session.user.id,
          generationId: body.generationId,
          testCaseIndex: body.testCaseIndex,
          rating: body.rating,
        },
      })

  return Response.json({ feedback })
}
