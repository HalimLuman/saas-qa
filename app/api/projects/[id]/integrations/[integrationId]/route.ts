import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const MASKED = '••••••••'

const SECRET_FIELDS: Record<string, string[]> = {
  AZURE_DEVOPS: ['pat'],
  JIRA: ['apiToken'],
  GITHUB: ['token'],
  LINEAR: ['apiKey'],
}

function maskConfig(provider: string, config: Record<string, string>) {
  const masked = { ...config }
  for (const f of SECRET_FIELDS[provider] ?? []) {
    if (masked[f]) masked[f] = MASKED
  }
  return masked
}

async function getIntegration(integrationId: string, projectId: string, userId: string) {
  return db.integration.findFirst({
    where: { id: integrationId, projectId, project: { userId } },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; integrationId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, integrationId } = await params
  const integration = await getIntegration(integrationId, id, session.user.id)
  if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    integration: { ...integration, config: maskConfig(integration.provider, JSON.parse(integration.config)) },
  })
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; integrationId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, integrationId } = await params
  const existing = await getIntegration(integrationId, id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })

  const { name, config: newConfigPartial, isActive } = parsed.data
  let configToStore = existing.config

  if (newConfigPartial) {
    const existing_config = JSON.parse(existing.config) as Record<string, string>
    const merged = { ...existing_config }
    for (const [k, v] of Object.entries(newConfigPartial)) {
      if (v !== MASKED) merged[k] = v
    }
    configToStore = JSON.stringify(merged)
  }

  const updated = await db.integration.update({
    where: { id: integrationId },
    data: {
      ...(name !== undefined && { name }),
      ...(isActive !== undefined && { isActive }),
      config: configToStore,
    },
  })

  return NextResponse.json({
    integration: { ...updated, config: maskConfig(updated.provider, JSON.parse(updated.config)) },
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; integrationId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, integrationId } = await params
  const existing = await getIntegration(integrationId, id, session.user.id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await db.integration.delete({ where: { id: integrationId } })
  return NextResponse.json({ ok: true })
}
