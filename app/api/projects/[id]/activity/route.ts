import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const events = await db.activityEvent.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { user: { select: { name: true, email: true } } },
  })

  return Response.json({ events })
}
