import type { APIRoute } from 'astro'
import { buildCheckoutUrl, type CheckoutInput } from '../../lib/founderplus-checkout'

export const POST: APIRoute = async ({ request }) => {
  let input: CheckoutInput
  try {
    input = (await request.json()) as CheckoutInput
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  const result = await buildCheckoutUrl(input)
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 400,
    headers: { 'Content-Type': 'application/json' }
  })
}
