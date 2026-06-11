import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getCustomerPortalUrl } from '@/lib/lemonsqueezy'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return Response.json({ error: 'No billing account found' }, { status: 400 })
  }

  const portalUrl = await getCustomerPortalUrl(user.stripeCustomerId)
  if (!portalUrl) {
    return Response.json({ error: 'Could not get portal URL' }, { status: 500 })
  }

  return Response.json({ url: portalUrl })
}
