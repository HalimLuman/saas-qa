import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'

const PRIORITY_VALUES = new Set(['P0', 'P1', 'P2', 'P3'])
const CATEGORY_VALUES = new Set(['FUNCTIONAL', 'NEGATIVE', 'BOUNDARY', 'SECURITY', 'PERFORMANCE', 'ACCESSIBILITY'])

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const cols: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cols.push(cur.trim()); cur = ''
      } else {
        cur += ch
      }
    }
    cols.push(cur.trim())
    rows.push(cols)
  }
  return rows
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: projectId } = await params
  const project = await db.project.findFirst({ where: { id: projectId, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const text = await (file as File).text()
    const rows = parseCSV(text)
    if (rows.length < 2) return Response.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })

    const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, '_'))
    const titleIdx      = headers.indexOf('title')
    const stepsIdx      = headers.indexOf('steps')
    const expectedIdx   = headers.indexOf('expected_result')
    const moduleIdx     = headers.indexOf('module')
    const precondIdx    = headers.indexOf('preconditions')
    const priorityIdx   = headers.indexOf('priority')
    const categoryIdx   = headers.indexOf('category')

    if (titleIdx === -1 || stepsIdx === -1 || expectedIdx === -1) {
      return Response.json({ error: 'CSV must include columns: title, steps, expected_result' }, { status: 400 })
    }

    const testCases = rows.slice(1).map((row) => {
      const priority = priorityIdx !== -1 && PRIORITY_VALUES.has((row[priorityIdx] ?? '').toUpperCase())
        ? (row[priorityIdx].toUpperCase() as 'P0' | 'P1' | 'P2' | 'P3')
        : 'P2' as const
      const category = categoryIdx !== -1 && CATEGORY_VALUES.has((row[categoryIdx] ?? '').toUpperCase())
        ? (row[categoryIdx].toUpperCase() as 'FUNCTIONAL' | 'NEGATIVE' | 'BOUNDARY' | 'SECURITY' | 'PERFORMANCE' | 'ACCESSIBILITY')
        : 'FUNCTIONAL' as const
      const rawSteps = row[stepsIdx] ?? ''
      const steps = rawSteps.split(/\n|;/).map((s) => s.trim()).filter(Boolean)

      return {
        projectId,
        title: row[titleIdx] ?? '',
        steps: JSON.stringify(steps.length ? steps : [rawSteps]),
        expectedResult: row[expectedIdx] ?? '',
        module: moduleIdx !== -1 ? (row[moduleIdx] || null) : null,
        preconditions: precondIdx !== -1 ? (row[precondIdx] || null) : null,
        priority,
        category,
        sourceType: 'MANUAL' as const,
      }
    }).filter((tc) => tc.title.trim())

    if (testCases.length === 0) {
      return Response.json({ error: 'No valid rows found' }, { status: 400 })
    }

    const result = await db.testCase.createMany({ data: testCases })

    logActivity({
      projectId,
      userId: session.user.id,
      action: 'test_case.csv_imported',
      targetType: 'TestCase',
      targetId: projectId,
      metadata: { count: result.count },
    })

    return Response.json({ imported: result.count }, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
