const LS_API_BASE = 'https://api.lemonsqueezy.com/v1'

function lsHeaders() {
  return {
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY!}`,
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  }
}

export async function createCheckoutUrl({
  variantId,
  email,
  userId,
  successUrl,
}: {
  variantId: string
  email: string
  userId: string
  successUrl: string
}): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID!

  const res = await fetch(`${LS_API_BASE}/checkouts`, {
    method: 'POST',
    headers: lsHeaders(),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            custom: { user_id: userId },
          },
          product_options: {
            redirect_url: successUrl,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: storeId } },
          variant: { data: { type: 'variants', id: variantId } },
        },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Lemon Squeezy checkout error: ${err}`)
  }

  const data = await res.json()
  return data.data.attributes.url as string
}

export async function getCustomerPortalUrl(customerId: string): Promise<string | null> {
  const res = await fetch(`${LS_API_BASE}/customers/${customerId}`, {
    headers: lsHeaders(),
  })
  if (!res.ok) return null
  const data = await res.json()
  return (data.data?.attributes?.urls?.customer_portal as string) ?? null
}
