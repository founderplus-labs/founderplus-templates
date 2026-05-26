/**
 * @founderplus/auth (vendored) — auth + product entitlement client for
 * academy.founderplus.id. Framework-agnostic; only assumption is a global
 * `fetch` (Node 18+, Workers, Deno, browsers). Vendored (not npm-installed)
 * for Cloudflare Workers bundling compatibility — same pattern as the
 * reference apps.
 *
 * SECURITY MODEL
 * - Session = opaque HttpOnly cookie. The browser never exposes it to JS,
 *   and this client never reads its contents. No tokens in localStorage.
 * - Your server is a proxy: it forwards the user's Cookie header to the API
 *   and re-emits any Set-Cookie it gets back. Always over HTTPS.
 * - MITM defense relies on TLS end-to-end. This client refuses a non-HTTPS
 *   apiBase unless it is explicitly localhost (dev). See assertSecureBase.
 */
export interface AuthClientConfig {
  apiBase?: string
  fetch?: typeof fetch
}

export interface Profile {
  uuid?: string
  id?: number | string
  name?: string
  email?: string
  avatar?: string
  [key: string]: unknown
}

export interface OwnedProduct {
  uuid: string
  slug: string
  title: string
  thumbnail?: string
  instructor?: string
  progress?: number
}

export interface FetchResult<T> {
  ok: boolean
  status: number
  data?: T
  setCookie: string[]
}

export interface LoginResult {
  ok: boolean
  status: number
  profile?: Profile
  setCookie: string[]
  error?: string
}

const DEFAULT_API_BASE = 'https://academy.founderplus.id/api/dev'

/**
 * Reject a plaintext API base in production. Session cookies travel on every
 * request; over http:// they are trivially sniffable / injectable (MITM).
 * localhost is allowed for local development only.
 */
function assertSecureBase(base: string): void {
  let u: URL
  try {
    u = new URL(base)
  } catch {
    throw new Error(`[founderplus-auth] invalid apiBase: ${base}`)
  }
  const isLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
  if (u.protocol !== 'https:' && !isLocal) {
    throw new Error(
      `[founderplus-auth] refusing non-HTTPS apiBase "${base}". ` +
        `Cookies must travel over TLS. Use https:// (localhost is exempt for dev).`
    )
  }
}

function readSetCookie(res: Response): string[] {
  const out: string[] = []
  const anyHeaders = res.headers as unknown as { getSetCookie?: () => string[] }
  if (typeof anyHeaders.getSetCookie === 'function') {
    out.push(...anyHeaders.getSetCookie())
    return out
  }
  res.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') out.push(v)
  })
  return out
}

export function mergeCookieHeader(setCookies: string[], existing: string): string {
  const map = new Map<string, string>()
  for (const part of existing.split(';').map((s) => s.trim()).filter(Boolean)) {
    const eq = part.indexOf('=')
    if (eq !== -1) map.set(part.slice(0, eq), part.slice(eq + 1))
  }
  for (const sc of setCookies) {
    const first = sc.split(';')[0] ?? ''
    const eq = first.indexOf('=')
    if (eq !== -1) map.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim())
  }
  return Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}

export function createAuthClient(config: AuthClientConfig = {}) {
  const apiBase = (config.apiBase ?? DEFAULT_API_BASE).replace(/\/$/, '')
  assertSecureBase(apiBase)
  const _fetch = config.fetch ?? globalThis.fetch

  async function call<T>(
    path: string,
    init: RequestInit = {},
    cookie?: string
  ): Promise<FetchResult<T>> {
    const headers = new Headers(init.headers)
    headers.set('Accept', 'application/json')
    headers.set('X-Requested-With', 'XMLHttpRequest')
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    if (cookie) headers.set('Cookie', cookie)

    const res = await _fetch(`${apiBase}/${path}`, {
      ...init,
      headers,
      // Never auto-follow redirects: a 3xx to an attacker-controlled host
      // would leak the forwarded Cookie header.
      redirect: 'manual'
    })

    let data: T | undefined
    try {
      data = (await res.clone().json()) as T
    } catch {
      /* non-JSON or empty body */
    }
    return { ok: res.ok, status: res.status, data, setCookie: readSetCookie(res) }
  }

  async function verifySession(cookie: string | undefined): Promise<Profile | null> {
    if (!cookie) return null
    const res = await call<{ status: string; payload: Profile }>(
      'auth/verify',
      { method: 'GET' },
      cookie
    )
    if (res.ok && res.data?.payload) return res.data.payload
    return null
  }

  async function refreshSession(cookie: string | undefined) {
    if (!cookie) return { ok: false, setCookie: [] as string[] }
    const res = await call('auth/refresh', { method: 'POST' }, cookie)
    return { ok: res.ok, setCookie: res.setCookie }
  }

  async function loginWithCredentials(email: string, password: string): Promise<LoginResult> {
    const res = await call<{ status: string; payload: { profile: Profile } }>('auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: email,
        password,
        login_type: 'email',
        auth_method: 'cookie'
      })
    })
    return {
      ok: res.ok,
      status: res.status,
      profile: res.data?.payload?.profile,
      setCookie: res.setCookie,
      error: res.ok
        ? undefined
        : ((res.data as unknown as { message?: string })?.message ?? 'Login gagal')
    }
  }

  async function logoutSession(cookie: string | undefined) {
    if (!cookie) return { setCookie: [] as string[] }
    const res = await call('auth/logout', { method: 'POST' }, cookie)
    return { setCookie: res.setCookie }
  }

  /** Products the user has PURCHASED. */
  async function getOwnedProducts(cookie: string | undefined): Promise<OwnedProduct[]> {
    if (!cookie) return []
    const res = await call<{ payload: OwnedProduct[] } | OwnedProduct[]>(
      'products/my-products',
      { method: 'GET' },
      cookie
    )
    if (!res.ok || !res.data) return []
    const payload =
      (res.data as { payload?: OwnedProduct[] }).payload ?? (res.data as OwnedProduct[])
    return Array.isArray(payload) ? payload : []
  }

  /**
   * Product slugs the user CREATED (their own catalog). Used for the owner
   * bypass so a creator can always access their own product without buying.
   * Uses the caller's own authenticated session — no elevated privilege.
   */
  async function getCreatedProductSlugs(cookie: string | undefined): Promise<string[]> {
    if (!cookie) return []
    const res = await call<{ payload?: unknown; data?: unknown }>(
      'creator/products?per_page=100',
      { method: 'GET' },
      cookie
    )
    if (!res.ok || !res.data) return []
    const raw =
      (res.data as { payload?: unknown }).payload ??
      (res.data as { data?: unknown }).data ??
      res.data
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { data?: unknown[] })?.data)
        ? (raw as { data: unknown[] }).data
        : []
    return (list as Array<{ slug?: string }>).map((p) => p.slug).filter(Boolean) as string[]
  }

  function hasProductAccess(products: OwnedProduct[], slug: string): boolean {
    return products.some((p) => p.slug === slug)
  }

  function hasAnyProductAccess(products: OwnedProduct[], slugs: string[]): boolean {
    const set = new Set(slugs)
    return products.some((p) => set.has(p.slug))
  }

  return {
    apiBase,
    verifySession,
    refreshSession,
    loginWithCredentials,
    logoutSession,
    getOwnedProducts,
    getCreatedProductSlugs,
    hasProductAccess,
    hasAnyProductAccess
  }
}

export type AuthClient = ReturnType<typeof createAuthClient>

export function isStaffEmail(email: string | undefined, domain = '@founderplus.id'): boolean {
  if (!email) return false
  return email.toLowerCase().trim().endsWith(domain)
}

export type GateResult =
  | { kind: 'allow'; profile: Profile; reason: 'owner' | 'staff' | 'purchased' | 'open'; refreshedCookies: string[] }
  | { kind: 'login'; refreshedCookies: string[] }
  | { kind: 'pay'; profile: Profile; refreshedCookies: string[] }

export interface GatePolicy {
  /** Slugs that grant access. Logged-in user must own at least one. */
  requireProductSlugs?: string[]
  /** Email domain suffix that bypasses the product check. Default: @founderplus.id */
  staffDomain?: string
  /**
   * Owner bypass: if true, a user who CREATED one of requireProductSlugs is
   * allowed without purchasing. The creator can always access their own
   * product. Default: true.
   */
  allowOwner?: boolean
  /** Skip the gate entirely (dev only). Default: false. */
  bypass?: boolean
}

/**
 * Full login + product gate. Order of allow checks:
 *   1. dev bypass (explicit)
 *   2. logged-in + no product requirement → open
 *   3. staff email domain
 *   4. owner (created the product)   ← lets the maker access their own product
 *   5. purchased the product
 * Otherwise → pay.
 */
export async function evaluateGate(
  client: AuthClient,
  cookie: string,
  policy: GatePolicy = {}
): Promise<GateResult> {
  const refreshedCookies: string[] = []
  if (policy.bypass) {
    return {
      kind: 'allow',
      reason: 'open',
      profile: { name: 'Dev User', email: 'dev@localhost' },
      refreshedCookies
    }
  }

  let profile = await client.verifySession(cookie)
  if (!profile) {
    const r = await client.refreshSession(cookie)
    if (r.ok && r.setCookie.length > 0) {
      refreshedCookies.push(...r.setCookie)
      profile = await client.verifySession(mergeCookieHeader(r.setCookie, cookie))
    }
  }
  if (!profile) return { kind: 'login', refreshedCookies }

  const slugs = policy.requireProductSlugs ?? []
  if (slugs.length === 0) {
    return { kind: 'allow', reason: 'open', profile, refreshedCookies }
  }

  if (isStaffEmail(profile.email, policy.staffDomain)) {
    return { kind: 'allow', reason: 'staff', profile, refreshedCookies }
  }

  const cookieForApi = refreshedCookies.length
    ? mergeCookieHeader(refreshedCookies, cookie)
    : cookie

  // Owner bypass — the maker accessing their own product.
  if (policy.allowOwner !== false) {
    const created = await client.getCreatedProductSlugs(cookieForApi)
    if (created.some((s) => slugs.includes(s))) {
      return { kind: 'allow', reason: 'owner', profile, refreshedCookies }
    }
  }

  const products = await client.getOwnedProducts(cookieForApi)
  if (client.hasAnyProductAccess(products, slugs)) {
    return { kind: 'allow', reason: 'purchased', profile, refreshedCookies }
  }
  return { kind: 'pay', profile, refreshedCookies }
}
