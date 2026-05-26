import { NextResponse } from 'next/server'
import { authClient } from '../../../lib/auth'

export async function POST(req: Request) {
  let body: { email?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid body' }, { status: 400 })
  }
  if (typeof body.email !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ ok: false, error: 'email + password required' }, { status: 400 })
  }
  const r = await authClient.loginWithCredentials(body.email.trim(), body.password)
  const res = NextResponse.json({ ok: r.ok, error: r.error }, { status: r.ok ? 200 : 401 })
  // Re-emit session cookies verbatim (preserves Secure/HttpOnly/SameSite).
  if (r.ok) for (const sc of r.setCookie) res.headers.append('set-cookie', sc)
  return res
}
