import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import {
  createTestCase,
  addTestCaseToSuite,
  type AzureDevOpsConfig,
} from '@/lib/integrations/azure-devops'

const pushSchema = z.object({
  testCaseIds: z.array(z.string()).min(1).max(100),
  testPlanId: z.string().optional(),
  testSuiteId: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; integrationId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, integrationId } = await params

  const integration = await db.integration.findFirst({
    where: { id: integrationId, projectId: id, project: { userId: session.user.id } },
  })
  if (!integration) return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  if (integration.provider !== 'AZURE_DEVOPS') {
    return NextResponse.json({ error: 'Test case push is only supported for Azure DevOps' }, { status: 400 })
  }
  if (!integration.isActive) return NextResponse.json({ error: 'Integration is disabled' }, { status: 400 })

  const body = await req.json()
  const parsed = pushSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })

  const { testCaseIds, testPlanId, testSuiteId } = parsed.data
  const config = JSON.parse(integration.config) as AzureDevOpsConfig

  const testCases = await db.testCase.findMany({
    where: { id: { in: testCaseIds }, projectId: id },
  })
  if (testCases.length === 0) return NextResponse.json({ error: 'No matching test cases' }, { status: 400 })

  const results: { title: string; adoId: number; url: string }[] = []
  const errors: { title: string; error: string }[] = []

  const effectivePlanId = testPlanId ?? config.testPlanId
  const effectiveSuiteId = testSuiteId ?? config.testSuiteId

  for (const tc of testCases) {
    let steps: string[] = []
    try { steps = JSON.parse(tc.steps) } catch { steps = [tc.steps] }

    try {
      const created = await createTestCase(config, {
        title: tc.title,
        steps,
        expectedResult: tc.expectedResult,
        preconditions: tc.preconditions ?? undefined,
        priority: tc.priority,
        module: tc.module ?? undefined,
      })

      if (effectivePlanId && effectiveSuiteId) {
        await addTestCaseToSuite(config, effectivePlanId, effectiveSuiteId, created.id)
      }

      results.push({ title: tc.title, adoId: created.id, url: created.url })
    } catch (err: unknown) {
      errors.push({ title: tc.title, error: String(err) })
    }
  }

  return NextResponse.json({ pushed: results.length, results, errors })
}
