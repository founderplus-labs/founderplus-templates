import type { APIRoute } from 'astro'
import { authClient, applySetCookies } from '../../lib/auth'

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'invalid body' }, 400)
  }
  if (typeof body.email !== 'string' || typeof body.password !== 'string') {
    return json({ ok: false, error: 'email + password required' }, 400)
  }
  const r = await authClient.loginWithCredentials(body.email.trim(), body.password)
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (r.ok) applySetCookies(headers, r.setCookie)
  return new Response(JSON.stringify({ ok: r.ok, error: r.error }), {
    status: r.ok ? 200 : 401,
    headers
  })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
