import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { planAllows, planRequiredResponse } from '@/lib/limits'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const userPlan = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
  if (!planAllows(userPlan?.plan ?? 'FREE', 'versioning')) {
    return planRequiredResponse('versioning', 'PRO')
  }

  const { id } = await params
  const testCase = await db.testCase.findFirst({
    where: { id, project: { userId: session.user.id } },
    select: { id: true },
  })
  if (!testCase) return Response.json({ error: 'Not found' }, { status: 404 })

  const versions = await db.testCaseVersion.findMany({
    where: { testCaseId: id },
    orderBy: { versionNumber: 'desc' },
  })
  return Response.json({ versions })
}
