import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const createAreaSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const areas = await db.area.findMany({
    where: { projectId: id },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      _count: { select: { testCases: true, bugReports: true } },
    },
  })

  return Response.json({ areas })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const { name, description, color } = createAreaSchema.parse(body)

    const lastArea = await db.area.findFirst({
      where: { projectId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const area = await db.area.create({
      data: {
        projectId: id,
        name,
        description,
        color: color ?? '#64748b',
        sortOrder: (lastArea?.sortOrder ?? -1) + 1,
      },
      include: {
        _count: { select: { testCases: true, bugReports: true } },
      },
    })

    return Response.json({ area }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
