import { NextResponse } from 'next/server'
import { authClient, cookieHeader } from '../../../lib/auth'

export async function POST() {
  const r = await authClient.logoutSession(await cookieHeader())
  const res = NextResponse.json({ ok: true })
  for (const sc of r.setCookie) res.headers.append('set-cookie', sc)
  return res
}
