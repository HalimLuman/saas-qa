import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const updateBugSchema = z.object({
  status:           z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'WONT_FIX']).optional(),
  title:            z.string().min(1).optional(),
  description:      z.string().optional(),
  severity:         z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  stepsToReproduce: z.array(z.string()).optional(),
  expectedBehavior: z.string().nullable().optional(),
  actualBehavior:   z.string().nullable().optional(),
  areaId:           z.string().nullable().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bugId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, bugId } = await params

  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const parsed = updateBugSchema.parse(body)

    const updateData: Record<string, unknown> = {}
    if (parsed.status           !== undefined) updateData.status           = parsed.status
    if (parsed.title            !== undefined) updateData.title            = parsed.title
    if (parsed.description      !== undefined) updateData.description      = parsed.description
    if (parsed.severity         !== undefined) updateData.severity         = parsed.severity
    if (parsed.stepsToReproduce !== undefined) updateData.stepsToReproduce = JSON.stringify(parsed.stepsToReproduce)
    if (parsed.expectedBehavior !== undefined) updateData.expectedBehavior = parsed.expectedBehavior || null
    if (parsed.actualBehavior   !== undefined) updateData.actualBehavior   = parsed.actualBehavior   || null
    if (parsed.areaId           !== undefined) updateData.areaId           = parsed.areaId

    const bug = await db.bugReport.update({
      where: { id: bugId, projectId: id },
      data: updateData,
    })

    return Response.json({ bug })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
