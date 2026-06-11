import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft, Download, Pencil, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import StartRunButton from './start-run-button'
import PushTestsButton from '@/components/push-tests-button'

export default async function SuiteDetailPage({
  params,
}: {
  params: Promise<{ id: string; suiteId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id, suiteId } = await params
  const suite = await db.regressionSuite.findFirst({
    where: { id: suiteId, project: { id, userId: session.user.id } },
    include: {
      testCases: { orderBy: { sortOrder: 'asc' }, include: { testCase: true } },
      runs: {
        orderBy: { startedAt: 'desc' },
        take: 5,
        include: {
          results: { select: { result: true } },
        },
      },
    },
  })

  if (!suite) notFound()

  const testCaseIds = suite.testCases.map(({ testCase: tc }) => tc.id)

  const priorities = suite.testCases.reduce<Record<string, number>>((acc, { testCase: tc }) => {
    acc[tc.priority] = (acc[tc.priority] || 0) + 1
    return acc
  }, {})

  const PRIORITY_VARIANTS = { P0: 'p0', P1: 'p1', P2: 'p2', P3: 'p3' } as const

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href={`/project/${id}`} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to project
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{suite.name}</h1>
          {suite.description && <p className="text-slate-500 text-sm mt-1">{suite.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/project/${id}/suites/${suiteId}/edit`}>
            <Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" />Edit suite</Button>
          </Link>
          <StartRunButton suiteId={suiteId} projectId={id} />
          <a href={`/api/suites/${suiteId}/export?format=csv`} download>
            <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" />CSV</Button>
          </a>
          <a href={`/api/suites/${suiteId}/export?format=xlsx`} download>
            <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" />Excel</Button>
          </a>
          <a href={`/api/suites/${suiteId}/export?format=json`} download>
            <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" />JSON</Button>
          </a>
          <PushTestsButton projectId={id} testCaseIds={testCaseIds} />
        </div>
      </div>

      {/* Coverage Stats */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 flex-wrap">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{suite.testCases.length}</p>
          <p className="text-xs text-slate-500">Total Cases</p>
        </div>
        {['P0', 'P1', 'P2', 'P3'].map((p) =>
          priorities[p] ? (
            <div key={p} className="text-center">
              <p className="text-xl font-bold text-slate-900">{priorities[p]}</p>
              <Badge variant={PRIORITY_VARIANTS[p as keyof typeof PRIORITY_VARIANTS]}>{p}</Badge>
            </div>
          ) : null
        )}
      </div>

      {/* Past runs */}
      {suite.runs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Recent Runs</h2>
          <div className="space-y-2">
            {suite.runs.map((run) => {
              const passed = run.results.filter((r) => r.result === 'PASSED').length
              const failed = run.results.filter((r) => r.result === 'FAILED').length
              const total = run.results.length
              return (
                <Link
                  key={run.id}
                  href={`/project/${id}/suites/${suiteId}/run/${run.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-white hover:bg-slate-50 transition-colors"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  {run.status === 'COMPLETED'
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    : <Clock className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">{run.name ?? 'Run'}</span>
                  <span className="text-xs text-slate-400">{formatDate(run.startedAt)}</span>
                  {total > 0 && (
                    <span className="text-xs font-medium">
                      <span className="text-green-600">{passed}✓</span>
                      {failed > 0 && <span className="text-red-500 ml-1">{failed}✗</span>}
                      <span className="text-slate-400 ml-1">/{total}</span>
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Test case list */}
      <div className="space-y-2">
        {suite.testCases.map(({ testCase: tc }, idx) => (
          <Card key={tc.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-sm text-slate-400 font-mono w-6 shrink-0">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={PRIORITY_VARIANTS[tc.priority as keyof typeof PRIORITY_VARIANTS]}>{tc.priority}</Badge>
                  {tc.module && <span className="text-xs text-slate-500">{tc.module}</span>}
                </div>
                <p className="text-sm font-medium text-slate-900">{tc.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
