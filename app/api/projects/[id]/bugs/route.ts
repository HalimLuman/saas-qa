import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sanitizeInput, sanitizeArray } from '@/lib/sanitize'
import { logActivity } from '@/lib/activity'

const createBugSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1),
  stepsToReproduce: z.array(z.string()),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  environment: z.record(z.string(), z.string()).optional(),
  areaId: z.string().optional(),
  attachments: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = request.nextUrl
  const status = searchParams.get('status')
  const severity = searchParams.get('severity')

  const bugs = await db.bugReport.findMany({
    where: {
      projectId: id,
      ...(status ? { status: status as any } : {}),
      ...(severity ? { severity: severity as any } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ bugs })
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
    const parsed = createBugSchema.parse(body)

    const title = sanitizeInput(parsed.title, 500)
    const description = sanitizeInput(parsed.description, 10000)
    const stepsToReproduce = sanitizeArray(parsed.stepsToReproduce)
    const expectedBehavior = parsed.expectedBehavior ? sanitizeInput(parsed.expectedBehavior, 5000) : undefined
    const actualBehavior = parsed.actualBehavior ? sanitizeInput(parsed.actualBehavior, 5000) : undefined
    const { severity, environment, areaId, attachments } = parsed

    // Auto-increment sequence number per project
    const lastBug = await db.bugReport.findFirst({
      where: { projectId: id },
      orderBy: { sequenceNum: 'desc' },
      select: { sequenceNum: true },
    })
    const sequenceNum = (lastBug?.sequenceNum ?? 0) + 1

    const bug = await db.bugReport.create({
      data: {
        projectId: id,
        areaId: areaId ?? null,
        sequenceNum,
        title,
        description,
        stepsToReproduce: JSON.stringify(stepsToReproduce),
        expectedBehavior,
        actualBehavior,
        severity: severity ?? 'MEDIUM',
        environment: environment ? JSON.stringify(environment) : null,
        attachments: attachments ?? null,
      },
    })

    logActivity({ projectId: id, userId: session.user.id, action: 'bug.created', targetType: 'BugReport', targetId: bug.id, metadata: { title: bug.title, severity: bug.severity } })

    return Response.json({ bug }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    console.error(err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
