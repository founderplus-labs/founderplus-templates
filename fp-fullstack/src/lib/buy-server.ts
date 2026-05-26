/**
 * Server-side checkout — replicates funnel-tracker.js behavior but fetches
 * product detail server-to-server (avoids the academy CORS block).
 *
 * Flow:
 *   1. validate slug + productType
 *   2. GET {API_BASE}/{path}/{slug} → product detail
 *   3. build payload { uuid, title, price, productType, slug, ... }
 *   4. return ACADEMY/payment?data=<encoded JSON> → caller sets location
 *
 * SECURITY
 * - slug is strictly validated (^[a-z0-9][a-z0-9-]{0,99}$) before it ever
 *   reaches the API URL — prevents path traversal / SSRF via the slug.
 * - The redirect target is a HARDCODED academy origin. We never accept a
 *   redirect URL from the client (no open-redirect).
 * - productType is whitelisted against PRODUCT_TYPES.
 */
import { createServerFn } from '@tanstack/react-start'

const ACADEMY_URL = 'https://academy.founderplus.id'
const API_BASE = `${ACADEMY_URL}/api/dev`

const PRODUCT_TYPES = {
  course: { id: 0, value: 'course', path: 'courses', title: 'Course' },
  event: { id: 1, value: 'event', path: 'events', title: 'Event' },
  learningPath: { id: 3, value: 'learningPath', path: 'learning-programs', title: 'Learning Program' },
  subscriptionPackage: { id: 4, value: 'subscriptionPackage', path: 'subscription-package', title: 'Subscription Package' },
  mentoring: { id: 5, value: 'mentoring', path: 'mentorings', title: 'Mentoring' },
  customProduct: { id: 6, value: 'customProduct', path: 'products', title: 'Custom Product' }
} as const

type ProductTypeKey = keyof typeof PRODUCT_TYPES

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,99}$/

interface BuyInput {
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
  const allow = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid']
  const out: Record<string, string> = {}
  for (const k of allow) {
    const v = utm[k]
    if (typeof v === 'string' && v.length <= 256) out[k] = v
  }
  return out
}

export const initiateCheckout = createServerFn({ method: 'POST' })
  .inputValidator((d: BuyInput) => d)
  .handler(async (ctx): Promise<CheckoutResult> => {
    const { slug, productType } = ctx.data
    if (!slug || !productType) return { ok: false, error: 'slug + productType required' }
    if (!SLUG_RE.test(slug)) return { ok: false, error: 'invalid slug' }

    const config = PRODUCT_TYPES[productType as ProductTypeKey]
    if (!config) return { ok: false, error: `unknown productType: ${productType}` }

    let detail: Response
    try {
      detail = await fetch(`${API_BASE}/${config.path}/${encodeURIComponent(slug)}`, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        redirect: 'manual'
      })
    } catch (e) {
      return { ok: false, error: `network error: ${(e as Error).message}` }
    }
    if (!detail.ok) return { ok: false, error: `product not found (${detail.status})` }

    let body: { payload?: Record<string, unknown>; data?: Record<string, unknown> } = {}
    try {
      body = await detail.json()
    } catch {
      return { ok: false, error: 'invalid product response' }
    }
    const product = body.payload ?? body.data ?? {}

    const payload = {
      uuid: product.uuid,
      title: product.title ?? product.name,
      price: product.price ?? product.sell_price ?? product.base_price,
      productType: config.value,
      productTypeId: config.id,
      slug,
      utm: sanitizeUtm(ctx.data.utm),
      referrer: typeof ctx.data.referrer === 'string' ? ctx.data.referrer.slice(0, 512) : null,
      landingPage: typeof ctx.data.landingPage === 'string' ? ctx.data.landingPage.slice(0, 512) : null
    }

    if (!payload.uuid) return { ok: false, error: 'product missing uuid' }

    // Redirect target is always the hardcoded academy payment page.
    const url = `${ACADEMY_URL}/payment?data=${encodeURIComponent(JSON.stringify(payload))}`
    return { ok: true, url }
  })
