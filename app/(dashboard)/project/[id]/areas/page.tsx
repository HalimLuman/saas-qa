import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import AreasPageContent from '@/components/areas-page-content'

export default async function AreasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true },
  })
  if (!project) notFound()

  const [areas, approvedByArea] = await Promise.all([
    db.area.findMany({
      where: { projectId: id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { testCases: true, bugReports: true } } },
    }),
    db.testCase.groupBy({
      by: ['areaId'],
      where: { projectId: id, status: 'APPROVED', isArchived: false, areaId: { not: null } },
      _count: { id: true },
    }),
  ])

  const approvedMap: Record<string, number> = {}
  for (const row of approvedByArea) {
    if (row.areaId) approvedMap[row.areaId] = row._count.id
  }

  const areasWithApproved = areas.map((a) => ({
    ...a,
    updatedAt: a.updatedAt.toISOString(),
    approvedCount: approvedMap[a.id] ?? 0,
  }))

  return (
    <div className="animate-fade-up space-y-5">
      <AreasPageContent projectId={id} projectName={project.name} areas={areasWithApproved} />
    </div>
  )
}
