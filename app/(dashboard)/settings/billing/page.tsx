import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { PLAN_LIMITS } from '@/lib/limits'
import BillingClient from './billing-client'

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      stripeCustomerId: true,
      stripeCurrentPeriodEnd: true,
      gracePeriodEnd: true,
      aiCallsToday: true,
      _count: { select: { projects: true } },
    },
  })

  if (!user) redirect('/login')

  const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.FREE

  return (
    <BillingClient
      plan={user.plan}
      hasStripe={!!user.stripeCustomerId}
      periodEnd={user.stripeCurrentPeriodEnd?.toISOString() ?? null}
      gracePeriodEnd={user.gracePeriodEnd?.toISOString() ?? null}
      usage={{
        projects: user._count.projects,
        projectsMax: limits.projects === Infinity ? -1 : limits.projects,
        aiCallsToday: user.aiCallsToday,
        aiCallsMax: limits.aiCredits,
      }}
    />
  )
}
