import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { createBug as adoCreateBug, type AzureDevOpsConfig } from '@/lib/integrations/azure-devops'
import { createIssue as jiraCreateIssue, type JiraConfig } from '@/lib/integrations/jira'
import { createIssue as ghCreateIssue, type GitHubConfig } from '@/lib/integrations/github-issues'
import { createIssue as linearCreateIssue, type LinearConfig } from '@/lib/integrations/linear'

const pushSchema = z.object({ integrationId: z.string() })

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bugId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, bugId } = await params

    const bug = await db.bugReport.findFirst({
      where: { id: bugId, project: { id, userId: session.user.id } },
    })
    if (!bug) return NextResponse.json({ error: 'Bug not found' }, { status: 404 })

    const body = await req.json()
    const parsed = pushSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })

    const integration = await db.integration.findFirst({
      where: { id: parsed.data.integrationId, projectId: id, project: { userId: session.user.id } },
    })
    if (!integration) return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    if (!integration.isActive) return NextResponse.json({ error: 'Integration is disabled' }, { status: 400 })

    let steps: string[] = []
    try { steps = JSON.parse(bug.stepsToReproduce) } catch { steps = bug.stepsToReproduce ? [bug.stepsToReproduce] : [] }

    const bugInput = {
      sequenceNum: bug.sequenceNum,
      title: bug.title,
      description: bug.description,
      stepsToReproduce: steps,
      expectedBehavior: bug.expectedBehavior ?? undefined,
      actualBehavior: bug.actualBehavior ?? undefined,
      severity: bug.severity,
      environment: bug.environment ?? undefined,
    }

    let config: Record<string, string>
    try {
      config = JSON.parse(integration.config)
    } catch {
      return NextResponse.json({ error: 'Integration config is corrupted' }, { status: 500 })
    }

    let result: { url: string; externalId: string }

    if (integration.provider === 'AZURE_DEVOPS') {
      const r = await adoCreateBug(config as AzureDevOpsConfig, bugInput)
      result = { url: r.url, externalId: String(r.id) }
    } else if (integration.provider === 'JIRA') {
      const r = await jiraCreateIssue(config as JiraConfig, bugInput)
      result = { url: r.url, externalId: r.key }
    } else if (integration.provider === 'GITHUB') {
      const r = await ghCreateIssue(config as GitHubConfig, bugInput)
      result = { url: r.url, externalId: String(r.number) }
    } else if (integration.provider === 'LINEAR') {
      const r = await linearCreateIssue(config as LinearConfig, bugInput)
      result = { url: r.url, externalId: r.id }
    } else {
      return NextResponse.json({ error: `Unsupported provider: ${integration.provider}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true, url: result.url, externalId: result.externalId })
  } catch (err: unknown) {
    console.error('[push bug]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
