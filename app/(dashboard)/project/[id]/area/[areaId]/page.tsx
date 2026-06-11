import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft, Bug, FlaskConical, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TestCaseList from '@/components/test-case-list'
import BugList from '@/components/bug-list'
import TestsTabActions from '@/components/tests-tab-actions'

export default async function AreaPage({
  params,
}: {
  params: Promise<{ id: string; areaId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id, areaId } = await params

  const area = await db.area.findFirst({
    where: { id: areaId, project: { id, userId: session.user.id } },
    include: {
      _count: { select: { testCases: true, bugReports: true } },
    },
  })

  if (!area) notFound()

  const [rawTestCases, bugReports] = await Promise.all([
    db.testCase.findMany({
      where: { projectId: id, areaId, isArchived: false },
      orderBy: { createdAt: 'asc' },
      include: { area: { select: { name: true, color: true } } },
    }),
    db.bugReport.findMany({
      where: { projectId: id, areaId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const testCases = rawTestCases.map((tc, idx) => ({
    ...tc,
    displayNum: idx + 1,
    areaName: tc.area?.name ?? null,
    areaColor: tc.area?.color ?? null,
    updatedAt: tc.updatedAt.toISOString(),
    createdAt: tc.createdAt.toISOString(),
  })).sort((a, b) => {
    const PORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }
    const pa = PORDER[a.priority] ?? 9
    const pb = PORDER[b.priority] ?? 9
    return pa !== pb ? pa - pb : b.displayNum - a.displayNum
  })

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <Link
          href={`/project/${id}/areas`}
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-3 transition-colors group"
          style={{ color: 'rgba(100,116,139,0.8)' }}
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="group-hover:text-slate-700 transition-colors">Areas</span>
        </Link>

        <div
          className="rounded-2xl px-6 py-5"
          style={{
            background: 'rgba(255,255,255,0.68)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.82)',
            boxShadow: '0 4px 24px -4px rgba(15,23,42,0.06)',
            borderTop: `3px solid ${area.color}`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-base"
              style={{ background: area.color }}
            >
              {area.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
                {area.name}
              </h1>
              {area.description && (
                <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{area.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: 'rgba(100,116,139,0.8)' }}>
              <FlaskConical className="h-3.5 w-3.5 text-emerald-500" />
              {area._count.testCases} tests
            </span>
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: 'rgba(100,116,139,0.8)' }}>
              <Bug className="h-3.5 w-3.5 text-rose-400" />
              {area._count.bugReports} bugs
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="tests">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="tests">
              <FlaskConical className="h-3.5 w-3.5" />
              Tests
              <span className="ml-1 text-xs opacity-55">({area._count.testCases})</span>
            </TabsTrigger>
            <TabsTrigger value="bugs">
              <Bug className="h-3.5 w-3.5" />
              Bugs
              <span className="ml-1 text-xs opacity-55">({area._count.bugReports})</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <TabsContent value="tests" className="m-0">
              <TestsTabActions projectId={id} areaId={areaId} />
            </TabsContent>
            <TabsContent value="bugs" className="m-0">
              <Link href={`/project/${id}/bugs/new?areaId=${areaId}`}>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Report Bug
                </Button>
              </Link>
            </TabsContent>
          </div>
        </div>

        <TabsContent value="tests" className="mt-5">
          {testCases.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No tests in this area yet. Add one above.
            </div>
          ) : (
            <TestCaseList testCases={testCases} projectId={id} />
          )}
        </TabsContent>
        <TabsContent value="bugs" className="mt-5">
          {bugReports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No bugs reported in this area yet.
            </div>
          ) : (
            <BugList bugs={bugReports} projectId={id} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
