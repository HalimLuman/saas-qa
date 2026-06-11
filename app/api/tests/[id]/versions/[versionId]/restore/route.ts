import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, versionId } = await params

  const testCase = await db.testCase.findFirst({
    where: { id, project: { userId: session.user.id } },
  })
  if (!testCase) return Response.json({ error: 'Not found' }, { status: 404 })

  const version = await db.testCaseVersion.findFirst({
    where: { id: versionId, testCaseId: id },
  })
  if (!version) return Response.json({ error: 'Version not found' }, { status: 404 })

  // snapshot current before restoring
  const lastVersion = await db.testCaseVersion.findFirst({
    where: { testCaseId: id },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  })
  await db.testCaseVersion.create({
    data: {
      testCaseId: id,
      versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
      title: testCase.title,
      module: testCase.module,
      preconditions: testCase.preconditions,
      steps: testCase.steps,
      expectedResult: testCase.expectedResult,
      priority: testCase.priority,
      category: testCase.category,
      status: testCase.status,
      createdById: session.user.id,
    },
  })

  const updated = await db.testCase.update({
    where: { id },
    data: {
      title: version.title,
      module: version.module,
      preconditions: version.preconditions,
      steps: version.steps,
      expectedResult: version.expectedResult,
      priority: version.priority,
      category: version.category,
      status: version.status,
    },
  })

  return Response.json({ testCase: updated })
}
