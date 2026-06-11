import { db } from '@/lib/db'

export const PLAN_LIMITS = {
  FREE:  { projects: 1,        aiCredits: 5,   testCasesPerProject: 30,   bugsPerProject: 10   },
  PRO:   { projects: 10,       aiCredits: 150,  testCasesPerProject: 1500, bugsPerProject: 500  },
  TEAM:  { projects: Infinity, aiCredits: 300,  testCasesPerProject: Infinity, bugsPerProject: Infinity },
} as const

export type LimitType = 'projects' | 'aiCredits' | 'testCasesPerProject' | 'bugsPerProject'

export async function checkLimit(
  userId: string,
  limitType: LimitType,
  projectId?: string,
): Promise<{ allowed: boolean; current: number; max: number; plan: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, aiCallsToday: true },
  })
  if (!user) return { allowed: false, current: 0, max: 0, plan: 'FREE' }

  const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.FREE
  const max = limits[limitType]

  let current = 0

  switch (limitType) {
    case 'projects': {
      current = await db.project.count({ where: { userId } })
      break
    }
    case 'aiCredits': {
      current = user.aiCallsToday
      break
    }
    case 'testCasesPerProject': {
      if (projectId) {
        current = await db.testCase.count({ where: { projectId, isArchived: false } })
      }
      break
    }
    case 'bugsPerProject': {
      if (projectId) {
        current = await db.bugReport.count({ where: { projectId } })
      }
      break
    }
  }

  return {
    allowed: max === Infinity || current < max,
    current,
    max: max === Infinity ? -1 : max,
    plan: user.plan,
  }
}

export function planAllows(plan: string, feature: 'export' | 'apiTesting' | 'webhooks' | 'integrations' | 'versioning' | 'recordingAnalysis' | 'aiTools'): boolean {
  if (plan === 'TEAM') return true
  if (plan === 'PRO') return true
  // FREE plan: allow integrations so users can export bugs
  if (feature === 'integrations') return true
  return false
}

export function planRequiredResponse(feature: string, requiredPlan: 'PRO' | 'TEAM') {
  return Response.json(
    {
      error: 'PLAN_REQUIRED',
      feature,
      requiredPlan,
      upgradeUrl: '/settings/billing',
    },
    { status: 403 },
  )
}

export function limitExceededResponse(limitType: LimitType, current: number, max: number) {
  return Response.json(
    {
      error: 'LIMIT_REACHED',
      limitType,
      current,
      max,
      upgradeUrl: '/settings/billing',
    },
    { status: 403 },
  )
}
