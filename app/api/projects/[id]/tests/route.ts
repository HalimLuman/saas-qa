import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

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
  const priority = searchParams.get('priority')
  const module = searchParams.get('module')
  const status = searchParams.get('status')
  const archived = searchParams.get('archived') === 'true'

  const testCases = await db.testCase.findMany({
    where: {
      projectId: id,
      isArchived: archived,
      ...(priority ? { priority: priority as any } : {}),
      ...(module ? { module } : {}),
      ...(status ? { status: status as any } : {}),
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  })

  return Response.json({ testCases })
}
