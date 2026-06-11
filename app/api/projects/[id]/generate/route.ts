import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateTestCases } from '@/lib/ai/generate'
import { sanitizeInput } from '@/lib/sanitize'
import { PLAN_LIMITS } from '@/lib/limits'

const generateSchema = z.object({
  featureDescription: z.string().min(10).max(5000),
  testTypeFilter: z.string().optional(),
  module: z.string().optional(),
  categories: z.array(z.string()).optional(),
  count: z.number().int().min(1).max(25).optional(),
  priorityFloor: z.enum(['P0', 'P1', 'P2', 'P3']).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const count = await db.generationSession.count({ where: { projectId: id } })
  return Response.json({ count })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const project = await db.project.findFirst({ where: { id, userId: session.user.id } })
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const now = new Date()
  const resetTime = new Date(user.aiCallsReset)

  // FREE plan: aiCallsToday is a lifetime counter — never reset
  // PRO/TEAM: reset counter at the start of each calendar month
  if (user.plan !== 'FREE') {
    const needsReset =
      now.getMonth() !== resetTime.getMonth() ||
      now.getFullYear() !== resetTime.getFullYear()

    if (needsReset) {
      await db.user.update({
        where: { id: user.id },
        data: { aiCallsToday: 0, aiCallsReset: now },
      })
      user.aiCallsToday = 0
    }
  }

  const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.FREE
  const limit = limits.aiCredits

  if (user.aiCallsToday >= limit) {
    const isLifetime = user.plan === 'FREE'
    return Response.json(
      {
        error: 'LIMIT_REACHED',
        limitType: 'aiCredits',
        current: user.aiCallsToday,
        max: limit,
        upgradeUrl: '/settings/billing',
        message: isLifetime
          ? `You've used all ${limit} free AI credits. Upgrade to Pro for 150 credits per month.`
          : `You've used all ${limit} AI credits this month. They reset on the 1st.`,
      },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const parsed = generateSchema.parse(body)

    const featureDescription = sanitizeInput(parsed.featureDescription, 5000)
    const testTypeFilter = parsed.testTypeFilter ? sanitizeInput(parsed.testTypeFilter, 100) : undefined
    const module = parsed.module ? sanitizeInput(parsed.module, 200) : undefined
    const categories = parsed.categories?.map((c) => sanitizeInput(c, 50))
    const count = parsed.count ?? 6
    const priorityFloor = parsed.priorityFloor

    const [existingModulesRaw, existingTitlesRaw, projectSettings] = await Promise.all([
      db.testCase.findMany({
        where: { projectId: id },
        select: { module: true },
        distinct: ['module'],
      }),
      db.testCase.findMany({
        where: { projectId: id },
        select: { title: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      (db as any).projectSettings?.findUnique?.({ where: { projectId: id } }) ?? Promise.resolve(null),
    ])

    const existingModules = (existingModulesRaw as Array<{ module: string | null }>).map((m) => m.module).filter(Boolean) as string[]
    const existingTitles = (existingTitlesRaw as Array<{ title: string }>).map((t) => t.title)
    const customRules = (projectSettings as { customRules?: string | null } | null)?.customRules ?? undefined

    const generated = await generateTestCases(featureDescription, {
      modules: module ? [module] : existingModules,
      testTypeFilter,
      categories,
      count,
      priorityFloor,
      existingModules,
      existingTitles,
      customRules,
    })

    const newCallCount = user.aiCallsToday + 1

    const [, genSession] = await Promise.all([
      db.user.update({
        where: { id: user.id },
        data: { aiCallsToday: { increment: 1 } },
      }),
      db.generationSession.create({
        data: {
          projectId: id,
          userId: user.id,
          inputText: featureDescription,
          inputMode: 'FREE_TEXT',
          filterType: testTypeFilter ?? null,
          outputCases: JSON.stringify(generated),
          savedCaseIds: '[]',
          tokenUsage: '{}',
        },
      }),
    ])

    return Response.json({
      testCases: generated,
      sessionId: genSession.id,
      usage: {
        current: newCallCount,
        max: limit,
        remaining: limit - newCallCount,
        isLifetime: user.plan === 'FREE',
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ error: err.issues[0].message }, { status: 400 })
    }
    console.error('[generate]', err)
    return Response.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  }
}
