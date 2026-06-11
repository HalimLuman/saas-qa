import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { testConnection as adoTest } from '@/lib/integrations/azure-devops'
import { testConnection as jiraTest } from '@/lib/integrations/jira'
import { testConnection as ghTest } from '@/lib/integrations/github-issues'
import { testConnection as linearTest } from '@/lib/integrations/linear'
import { planAllows, planRequiredResponse } from '@/lib/limits'

const MASKED = '••••••••'

function maskConfig(provider: string, config: Record<string, string>): Record<string, string> {
  const masked = { ...config }
  const secretFields: Record<string, string[]> = {
    AZURE_DEVOPS: ['pat'],
    JIRA: ['apiToken'],
    GITHUB: ['token'],
    LINEAR: ['apiKey'],
  }
  for (const field of secretFields[provider] ?? []) {
    if (masked[field]) masked[field] = MASKED
  }
  return masked
}

const createSchema = z.object({
  provider: z.enum(['AZURE_DEVOPS', 'JIRA', 'GITHUB', 'LINEAR']),
  name: z.string().min(1).max(100),
  config: z.record(z.string(), z.string()),
  testBeforeSave: z.boolean().optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const integrations = await db.integration.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    integrations: integrations.map((i) => ({
      ...i,
      config: maskConfig(i.provider, JSON.parse(i.config)),
    })),
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userPlan = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
  if (!planAllows(userPlan?.plan ?? 'FREE', 'integrations')) {
    return planRequiredResponse('integrations', 'TEAM')
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })

  const { provider, name, config, testBeforeSave } = parsed.data

  if (testBeforeSave) {
    try {
      if (provider === 'AZURE_DEVOPS') await adoTest(config as never)
      if (provider === 'JIRA') await jiraTest(config as never)
      if (provider === 'GITHUB') await ghTest(config as never)
      if (provider === 'LINEAR') await linearTest(config as never)
    } catch (err: unknown) {
      return NextResponse.json({ error: String(err) }, { status: 422 })
    }
  }

  const integration = await db.integration.create({
    data: { projectId: id, provider, name, config: JSON.stringify(config) },
  })

  return NextResponse.json({
    integration: { ...integration, config: maskConfig(provider, config) },
  })
}
