import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return Response.json({ results: [] })

  const userId = session.user.id

  const [testCases, bugs, suites] = await Promise.all([
    db.testCase.findMany({
      where: {
        project: { userId },
        isArchived: false,
        title: { contains: q },
      },
      select: { id: true, title: true, priority: true, projectId: true, project: { select: { name: true } } },
      take: 6,
    }),
    db.bugReport.findMany({
      where: {
        project: { userId },
        title: { contains: q },
      },
      select: { id: true, title: true, severity: true, projectId: true, project: { select: { name: true } } },
      take: 6,
    }),
    db.regressionSuite.findMany({
      where: {
        project: { userId },
        name: { contains: q },
      },
      select: { id: true, name: true, projectId: true, project: { select: { name: true } } },
      take: 4,
    }),
  ])

  const results = {
    testCases: testCases.map((tc) => ({
      id: tc.id,
      title: tc.title,
      subtitle: `${tc.priority} · ${tc.project.name}`,
      href: `/project/${tc.projectId}`,
      type: 'test' as const,
    })),
    bugs: bugs.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: `${b.severity} · ${b.project.name}`,
      href: `/project/${b.projectId}/bugs/${b.id}`,
      type: 'bug' as const,
    })),
    suites: suites.map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.project.name,
      href: `/project/${s.projectId}/suites/${s.id}`,
      type: 'suite' as const,
    })),
  }

  return Response.json({ results })
}
