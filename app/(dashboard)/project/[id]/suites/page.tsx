import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import SuiteList from '@/components/suite-list'

export default async function SuitesPage({
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

  const suites = await db.regressionSuite.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { testCases: true } },
      runs: {
        orderBy: { startedAt: 'desc' },
        take: 7,
        select: {
          id: true,
          startedAt: true,
          status: true,
          results: { select: { result: true } },
        },
      },
    },
  })

  const totalCases = suites.reduce((sum, s) => sum + s._count.testCases, 0)

  return (
    <div className="animate-fade-up space-y-5">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 4 }}>
            {project.name}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, color: 'var(--text-primary)' }}>
            Regression suites
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 5 }}>
            {suites.length} suite{suites.length !== 1 ? 's' : ''} · {totalCases} test case{totalCases !== 1 ? 's' : ''} organised across cadences from per-PR smoke to weekly full passes.
          </p>
        </div>
        <Link
          href={`/project/${id}/suites/new`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New suite
        </Link>
      </div>

      <SuiteList suites={suites} projectId={id} />
    </div>
  )
}
