/**
 * Founder+ checkout (framework-agnostic). Mirrors funnel-tracker.js but
 * fetches product detail server-to-server. Returns the academy checkout URL.
 *
 * SECURITY
 * - slug validated (^[a-z0-9][a-z0-9-]{0,99}$) + encoded before the API URL
 *   (no path traversal / SSRF via slug)
 * - productType whitelisted
 * - redirect target is a HARDCODED academy origin (no open redirect)
 */
const ACADEMY_URL = 'https://academy.founderplus.id'
const API_BASE = `${ACADEMY_URL}/api/dev`

const PRODUCT_TYPES = {
  course: { id: 0, value: 'course', path: 'courses' },
  event: { id: 1, value: 'event', path: 'events' },
  learningPath: { id: 3, value: 'learningPath', path: 'learning-programs' },
  subscriptionPackage: { id: 4, value: 'subscriptionPackage', path: 'subscription-package' },
  mentoring: { id: 5, value: 'mentoring', path: 'mentorings' },
  customProduct: { id: 6, value: 'customProduct', path: 'products' }
} as const
type ProductTypeKey = keyof typeof PRODUCT_TYPES

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,99}$/
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid']

export interface CheckoutInput {
  slug: string
  productType: string
  utm?: Record<string, string>
  referrer?: string | null
  landingPage?: string | null
}
export interface CheckoutResult {
  ok: boolean
  url?: string
  error?: string
}

function sanitizeUtm(utm: Record<string, string> | undefined): Record<string, string> {
  if (!utm || typeof utm !== 'object') return {}
  const out: Record<string, string> = {}
  for (const k of UTM_KEYS) {
    const v = utm[k]
    if (typeof v === 'string' && v.length <= 256) out[k] = v
  }
  return out
}

export async function buildCheckoutUrl(
  input: CheckoutInput,
  fetchImpl: typeof fetch = fetch
): Promise<CheckoutResult> {
  const { slug, productType } = input
  if (!slug || !productType) return { ok: false, error: 'slug + productType required' }
  if (!SLUG_RE.test(slug)) return { ok: false, error: 'invalid slug' }

  const config = PRODUCT_TYPES[productType as ProductTypeKey]
  if (!config) return { ok: false, error: `unknown productType: ${productType}` }

  let res: Response
  try {
    res = await fetchImpl(`${API_BASE}/${config.path}/${encodeURIComponent(slug)}`, {
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      redirect: 'manual'
    })
  } catch (e) {
    return { ok: false, error: `network error: ${(e as Error).message}` }
  }
  if (!res.ok) return { ok: false, error: `product not found (${res.status})` }

  let body: { payload?: Record<string, unknown>; data?: Record<string, unknown> } = {}
  try {
    body = await res.json()
  } catch {
    return { ok: false, error: 'invalid product response' }
  }
  const product = body.payload ?? body.data ?? {}
  if (!product.uuid) return { ok: false, error: 'product missing uuid' }

  const payload = {
    uuid: product.uuid,
    title: product.title ?? product.name,
    price: product.price ?? product.sell_price ?? product.base_price,
    productType: config.value,
    productTypeId: config.id,
    slug,
    utm: sanitizeUtm(input.utm),
    referrer: typeof input.referrer === 'string' ? input.referrer.slice(0, 512) : null,
    landingPage: typeof input.landingPage === 'string' ? input.landingPage.slice(0, 512) : null
  }
  return { ok: true, url: `${ACADEMY_URL}/payment?data=${encodeURIComponent(JSON.stringify(payload))}` }
}
