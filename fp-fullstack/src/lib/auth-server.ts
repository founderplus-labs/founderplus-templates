/**
 * Server-side auth glue (TanStack Start). Forwards the user's cookie to
 * academy.founderplus.id and re-emits refreshed Set-Cookie headers.
 *
 * COOKIE SECURITY: we replay the API's Set-Cookie strings verbatim, so the
 * upstream Secure / HttpOnly / SameSite attributes are preserved — we never
 * downgrade them. Do not rewrite cookie attributes here.
 */
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server'
import { createAuthClient, evaluateGate, type GateResult } from './founderplus-auth'

function getEnv(name: string): string | undefined {
  // biome-ignore lint/suspicious/noExplicitAny: cross-runtime env probe
  const meta = (import.meta as any).env ?? {}
  if (meta[name]) return meta[name] as string
  if (typeof process !== 'undefined' && process.env?.[name]) return process.env[name]
  return undefined
}

const authClient = createAuthClient({
  apiBase: getEnv('FOUNDERPLUS_API_BASE') ?? 'https://academy.founderplus.id/api/dev'
})

// The product slug this app gates on. Set in .env — see SETUP.md.
const productSlug = getEnv('FOUNDERPLUS_PRODUCT_SLUG') ?? ''

// Dev bypass MUST never be true in production. Guarded: only honored when
// NODE_ENV !== 'production'.
const devBypass =
  getEnv('AUTH_DEV_BYPASS') === 'true' && getEnv('NODE_ENV') !== 'production'

function forwardSetCookies(setCookies: string[]) {
  if (setCookies.length === 0) return
  // Founderplus emits 1-2 cookies/response; comma-join is safe for that.
  setResponseHeader('set-cookie', setCookies.join(', '))
}

export const productSlugConfigured = productSlug

export const checkGate = createServerFn({ method: 'GET' }).handler(
  async (): Promise<GateResult> => {
    const cookie = getRequestHeader('cookie') ?? ''
    const result = await evaluateGate(authClient, cookie, {
      requireProductSlugs: productSlug ? [productSlug] : [],
      allowOwner: true, // creator can access their own product
      bypass: devBypass
    })
    forwardSetCookies(result.refreshedCookies)
    return result
  }
)

export const loginAction = createServerFn({ method: 'POST' })
  .inputValidator((d: { email: string; password: string }) => {
    // Minimal shape validation; never echo the password back.
    if (typeof d?.email !== 'string' || typeof d?.password !== 'string') {
      throw new Error('email + password required')
    }
    return { email: d.email.trim(), password: d.password }
  })
  .handler(async (ctx) => {
    const r = await authClient.loginWithCredentials(ctx.data.email, ctx.data.password)
    if (r.ok) forwardSetCookies(r.setCookie)
    return { ok: r.ok, error: r.error, profile: r.profile }
  })

export const logoutAction = createServerFn({ method: 'POST' }).handler(async () => {
  const cookie = getRequestHeader('cookie') ?? ''
  const r = await authClient.logoutSession(cookie)
  forwardSetCookies(r.setCookie)
  return { ok: true }
})
