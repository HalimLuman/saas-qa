import { createHmac } from 'crypto'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

function planFromVariant(variantId: number): 'PRO' | 'TEAM' {
  const teamMonthly = Number(process.env.LEMONSQUEEZY_TEAM_MONTHLY_VARIANT_ID)
  const teamAnnual  = Number(process.env.LEMONSQUEEZY_TEAM_ANNUAL_VARIANT_ID)
  return variantId === teamMonthly || variantId === teamAnnual ? 'TEAM' : 'PRO'
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig       = req.headers.get('x-signature')
  const eventName = req.headers.get('x-event-name')

  if (!sig) return new Response('Missing signature', { status: 400 })

  const digest = createHmac('sha256', process.env.LEMONSQUEEZY_SIGNING_SECRET!)
    .update(body)
    .digest('hex')

  if (digest !== sig) return new Response('Invalid signature', { status: 400 })

  const { meta, data } = JSON.parse(body) as {
    meta: { event_name: string; custom_data?: { user_id?: string } }
    data: { id: string; attributes: Record<string, unknown> }
  }

  const userId = meta?.custom_data?.user_id

  try {
    switch (eventName) {
      case 'subscription_created': {
        if (!userId) break
        const attrs = data.attributes
        const plan        = planFromVariant(attrs.variant_id as number)
        const customerId  = String(attrs.customer_id)
        const subId       = String(data.id)
        const renewsAt    = attrs.renews_at ? new Date(attrs.renews_at as string) : null

        await db.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeCustomerId:       customerId,
            stripeSubscriptionId:   subId,
            stripeCurrentPeriodEnd: renewsAt,
            gracePeriodEnd:         null,
          },
        })
        break
      }

      case 'subscription_updated': {
        if (!userId) break
        const attrs    = data.attributes
        const status   = attrs.status as string
        const isActive = status === 'active' || status === 'on_trial'
        const plan     = planFromVariant(attrs.variant_id as number)
        const renewsAt = attrs.renews_at ? new Date(attrs.renews_at as string) : null

        await db.user.update({
          where: { id: userId },
          data: {
            plan:                   isActive ? plan : 'FREE',
            stripeCurrentPeriodEnd: renewsAt,
          },
        })
        break
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        if (!userId) break
        await db.user.update({
          where: { id: userId },
          data: {
            plan:                   'FREE',
            stripeSubscriptionId:   null,
            stripeCurrentPeriodEnd: null,
            gracePeriodEnd:         null,
          },
        })
        break
      }

      case 'subscription_payment_success': {
        if (!userId) break
        const attrs    = data.attributes
        const renewsAt = attrs.renews_at ? new Date(attrs.renews_at as string) : null
        await db.user.update({
          where: { id: userId },
          data: { stripeCurrentPeriodEnd: renewsAt, gracePeriodEnd: null },
        })
        break
      }

      case 'subscription_payment_failed': {
        if (!userId) break
        const gracePeriodEnd = new Date()
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7)
        await db.user.update({
          where: { id: userId },
          data: { gracePeriodEnd },
        })
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new Response('Handler error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
