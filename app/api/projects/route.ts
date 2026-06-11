import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkLimit, limitExceededResponse } from '@/lib/limits'

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { testCases: true, bugReports: true, regressionSuites: true },
      },
    },
  })

  return Response.json({ projects })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const limitCheck = await checkLimit(session.user.id, 'projects')
  if (!limitCheck.allowed) return limitExceededResponse('projects', limitCheck.current, limitCheck.max)

  try {
    const body = await request.json()
    const { name, description } = createProjectSchema.parse(body)

    const project = await db.project.create({
      data: { name, description, userId: session.user.id },
    })

    return Response.json({ project }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
