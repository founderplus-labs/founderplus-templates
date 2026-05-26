/**
 * Astro server-side auth glue. Reads the request cookie, runs the gate, and
 * re-emits refreshed Set-Cookie on the response. Used from middleware + API
 * routes. Cookie attributes (Secure/HttpOnly/SameSite) are preserved verbatim.
 */
import { createAuthClient, evaluateGate, type GateResult } from './founderplus-auth'

function env(name: string): string | undefined {
  // biome-ignore lint: cross-runtime env probe
  const meta = (import.meta as any).env ?? {}
  if (meta[name]) return meta[name] as string
  if (typeof process !== 'undefined' && process.env?.[name]) return process.env[name]
  return undefined
}

export const PRODUCT_SLUG = env('FOUNDERPLUS_PRODUCT_SLUG') ?? ''
const DEV_BYPASS = env('AUTH_DEV_BYPASS') === 'true' && env('NODE_ENV') !== 'production'

export const authClient = createAuthClient({
  apiBase: env('FOUNDERPLUS_API_BASE') ?? 'https://academy.founderplus.id/api/dev'
})

/** Append Set-Cookie strings to a Headers object (preserves attributes). */
export function applySetCookies(headers: Headers, setCookies: string[]) {
  for (const sc of setCookies) headers.append('set-cookie', sc)
}

export async function gate(request: Request): Promise<{ result: GateResult; setCookies: string[] }> {
  const cookie = request.headers.get('cookie') ?? ''
  const result = await evaluateGate(authClient, cookie, {
    requireProductSlugs: PRODUCT_SLUG ? [PRODUCT_SLUG] : [],
    allowOwner: true,
    bypass: DEV_BYPASS
  })
  return { result, setCookies: result.refreshedCookies }
}
