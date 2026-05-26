/**
 * Next.js server-side auth glue. Reads the session cookie via next/headers and
 * runs the gate. Cookie WRITES (login/logout refresh) happen in route handlers
 * (app/api/*), where Next allows cookies().set(); a Server Component render
 * can't persist cookies, so the gate here is read-only.
 */
import 'server-only'
import { cookies } from 'next/headers'
import { createAuthClient, evaluateGate, type GateResult } from './founderplus-auth'

export const PRODUCT_SLUG = process.env.FOUNDERPLUS_PRODUCT_SLUG ?? ''
const DEV_BYPASS = process.env.AUTH_DEV_BYPASS === 'true' && process.env.NODE_ENV !== 'production'

export const authClient = createAuthClient({
  apiBase: process.env.FOUNDERPLUS_API_BASE ?? 'https://academy.founderplus.id/api/dev'
})

export async function cookieHeader(): Promise<string> {
  const store = await cookies()
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')
}

export async function gate(): Promise<GateResult> {
  return evaluateGate(authClient, await cookieHeader(), {
    requireProductSlugs: PRODUCT_SLUG ? [PRODUCT_SLUG] : [],
    allowOwner: true,
    bypass: DEV_BYPASS
  })
}
