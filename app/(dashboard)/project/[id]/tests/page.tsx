import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import TestsPageClient from './tests-page-client'

export default async function TestsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const [project, dbUser] = await Promise.all([
    db.project.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, name: true },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
  ])
  if (!project) notFound()

  const [rawTestCases, areas, suites] = await Promise.all([
    db.testCase.findMany({
      where: { projectId: id, isArchived: false },
      orderBy: { createdAt: 'asc' },
      include: { area: { select: { name: true, color: true } } },
    }),
    db.area.findMany({
      where: { projectId: id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true, color: true },
    }),
    db.regressionSuite.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true },
    }),
  ])

  const testCases = rawTestCases
    .map((tc, idx) => ({
      ...tc,
      displayNum: idx + 1,
      areaName: tc.area?.name ?? null,
      areaColor: tc.area?.color ?? null,
      updatedAt: tc.updatedAt.toISOString(),
      createdAt: tc.createdAt.toISOString(),
    }))
    .sort((a, b) => {
      const PORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }
      const pa = PORDER[a.priority] ?? 9
      const pb = PORDER[b.priority] ?? 9
      return pa !== pb ? pa - pb : b.displayNum - a.displayNum
    })

  const displayName = dbUser?.name ?? session.user.name ?? dbUser?.email?.split('@')[0] ?? 'U'
  const ownerInitials = displayName.slice(0, 2).toUpperCase()

  return (
    <TestsPageClient
      projectId={id}
      projectName={project.name}
      testCases={testCases}
      areas={areas}
      suites={suites}
      ownerInitials={ownerInitials}
      ownerName={displayName}
    />
  )
}
