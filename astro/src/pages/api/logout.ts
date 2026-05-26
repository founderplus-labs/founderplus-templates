import type { APIRoute } from 'astro'
import { authClient, applySetCookies } from '../../lib/auth'

export const POST: APIRoute = async ({ request }) => {
  const cookie = request.headers.get('cookie') ?? ''
  const r = await authClient.logoutSession(cookie)
  const headers = new Headers({ Location: '/' })
  applySetCookies(headers, r.setCookie)
  return new Response(null, { status: 303, headers })
}
