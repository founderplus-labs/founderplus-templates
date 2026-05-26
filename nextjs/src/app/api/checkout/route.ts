import { NextResponse } from 'next/server'
import { buildCheckoutUrl, type CheckoutInput } from '../../../lib/founderplus-checkout'

export async function POST(req: Request) {
  let input: CheckoutInput
  try {
    input = (await req.json()) as CheckoutInput
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid body' }, { status: 400 })
  }
  const result = await buildCheckoutUrl(input)
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
