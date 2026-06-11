import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const updateAreaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

async function getAreaForUser(areaId: string, userId: string) {
  return db.area.findFirst({
    where: { id: areaId, project: { userId } },
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const area = await db.area.findFirst({
    where: { id, project: { userId: session.user.id } },
    include: {
      _count: { select: { testCases: true, bugReports: true } },
    },
  })
  if (!area) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ area })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await getAreaForUser(id, session.user.id)
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = updateAreaSchema.parse(body)

    const area = await db.area.update({
      where: { id },
      data,
      include: {
        _count: { select: { testCases: true, bugReports: true } },
      },
    })

    return Response.json({ area })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await getAreaForUser(id, session.user.id)
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.area.delete({ where: { id } })

  return Response.json({ ok: true })
}
