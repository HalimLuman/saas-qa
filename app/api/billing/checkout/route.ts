import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createCheckoutUrl } from '@/lib/lemonsqueezy'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const body = await req.json().catch(() => ({}))
  const plan: 'PRO' | 'TEAM' = body.plan === 'TEAM' ? 'TEAM' : 'PRO'
  const interval: 'monthly' | 'annual' = body.interval === 'annual' ? 'annual' : 'monthly'

  const variantId =
    plan === 'PRO' && interval === 'annual'
      ? process.env.LEMONSQUEEZY_PRO_ANNUAL_VARIANT_ID!
      : plan === 'PRO'
      ? process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID!
      : plan === 'TEAM' && interval === 'annual'
      ? process.env.LEMONSQUEEZY_TEAM_ANNUAL_VARIANT_ID!
      : process.env.LEMONSQUEEZY_TEAM_MONTHLY_VARIANT_ID!

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'

  try {
    const url = await createCheckoutUrl({
      variantId,
      email: user?.email ?? '',
      userId: session.user.id,
      successUrl: `${baseUrl}/settings/billing?success=true`,
    })
    return Response.json({ url })
  } catch (err) {
    console.error('Checkout error:', err)
    return Response.json({ error: 'Could not create checkout' }, { status: 500 })
  }
}
