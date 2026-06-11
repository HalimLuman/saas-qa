import { NextRequest } from 'next/server'

export const maxDuration = 60
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { analyzeRecordingFrames } from '@/lib/ai/generate'

const schema = z.object({
  frames: z.array(z.string().min(1)).min(1).max(20),
  context: z.string().max(500).optional(),
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
    const { frames, context } = schema.parse(body)
    const testCase = await analyzeRecordingFrames(frames, context)
    return Response.json({ testCase })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    console.error('[analyze-recording] Error:', err)
    return Response.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
