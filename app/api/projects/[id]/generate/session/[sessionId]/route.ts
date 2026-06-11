import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, sessionId } = await params
  const gen = await db.generationSession.findFirst({
    where: { id: sessionId, projectId: id, userId: session.user.id },
    select: { inputText: true, filterType: true, inputMode: true },
  })
  if (!gen) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(gen)
}
