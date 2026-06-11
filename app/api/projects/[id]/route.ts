import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

async function getProject(id: string, userId: string) {
  return db.project.findFirst({ where: { id, userId } })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      _count: {
        select: { testCases: true, bugReports: true, regressionSuites: true },
      },
    },
  })

  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ project })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await getProject(id, session.user.id)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)
    const updated = await db.project.update({ where: { id }, data })
    return Response.json({ project: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await getProject(id, session.user.id)
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  await db.project.delete({ where: { id } })
  return Response.json({ success: true })
}
