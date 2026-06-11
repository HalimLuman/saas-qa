import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  variables: z.record(z.string(), z.string()).default({}),
  isDefault: z.boolean().default(false),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  const project = await db.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const environments = await db.apiEnvironment.findMany({
    where: { projectId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
  return Response.json({ environments })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  const project = await db.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    if (data.isDefault) {
      await db.apiEnvironment.updateMany({ where: { projectId }, data: { isDefault: false } })
    }

    const env = await db.apiEnvironment.create({
      data: { projectId, name: data.name, variables: JSON.stringify(data.variables), isDefault: data.isDefault },
    })
    return Response.json({ environment: env }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
