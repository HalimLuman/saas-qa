import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { suggestBugSeverity } from '@/lib/ai/generate'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
})

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
    const { title, description } = schema.parse(body)
    const result = await suggestBugSeverity(title, description)
    return Response.json(result)
  } catch {
    return Response.json({ severity: 'MEDIUM', reasoning: 'Could not determine severity' })
  }
}
