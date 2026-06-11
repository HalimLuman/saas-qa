import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateExcel } from '@/lib/export/excel'
import { generateCsv } from '@/lib/export/csv'
import { planAllows, planRequiredResponse } from '@/lib/limits'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const format = request.nextUrl.searchParams.get('format') || 'csv'

  const userPlan = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  if (!planAllows(userPlan?.plan ?? 'FREE', 'export')) {
    return planRequiredResponse('export', 'PRO')
  }

  const suite = await db.regressionSuite.findFirst({
    where: { id, project: { userId: session.user.id } },
    include: {
      testCases: {
        orderBy: { sortOrder: 'asc' },
        include: { testCase: true },
      },
    },
  })

  if (!suite) return Response.json({ error: 'Not found' }, { status: 404 })

  const rows = suite.testCases.map(({ testCase: tc }) => ({
    id: tc.id,
    title: tc.title,
    module: tc.module || '',
    preconditions: tc.preconditions || '',
    steps: (() => {
      try {
        const parsed = JSON.parse(tc.steps)
        return Array.isArray(parsed) ? parsed.join('\n') : tc.steps
      } catch { return tc.steps }
    })(),
    expectedResult: tc.expectedResult,
    priority: tc.priority,
    category: tc.category,
    status: tc.status,
  }))

  const filename = suite.name.replace(/\s+/g, '-')

  if (format === 'json') {
    const jsonRows = suite.testCases.map(({ testCase: tc }) => ({
      id: tc.id,
      title: tc.title,
      module: tc.module || null,
      preconditions: tc.preconditions || null,
      steps: (() => { try { return JSON.parse(tc.steps) } catch { return [tc.steps] } })(),
      expectedResult: tc.expectedResult,
      priority: tc.priority,
      category: tc.category,
      status: tc.status,
    }))
    const payload = JSON.stringify({ suite: { id: suite.id, name: suite.name }, testCases: jsonRows }, null, 2)
    return new Response(payload, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    })
  }

  if (format === 'xlsx') {
    const buffer = await generateExcel(rows, suite.name)
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    })
  }

  const buffer = await generateCsv(rows)
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  })
}
