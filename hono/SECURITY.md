# Security posture — Founder+ Fullstack Starter

This template is designed so a non-expert can ship a paywalled app without
opening a security hole. What it does, and why.

## Threat: man-in-the-middle (MITM) / cookie theft

- **TLS everywhere.** The auth client (`founderplus-auth.ts`) refuses a
  non-HTTPS `apiBase` in production (`assertSecureBase`); only `localhost` is
  exempt for dev. Session cookies never travel in cleartext.
- **HttpOnly opaque cookies.** The session is a server-set HttpOnly cookie.
  JavaScript can't read it, so XSS can't exfiltrate it. There is no token in
  `localStorage`.
- **Cookie attributes preserved.** `auth-server.ts` re-emits the API's
  `Set-Cookie` strings verbatim — it never strips `Secure` / `HttpOnly` /
  `SameSite`. Do not rewrite them.
- **No redirect following with credentials.** API calls use
  `redirect: 'manual'`, so a malicious 3xx can't bounce the forwarded `Cookie`
  header to another host.

## Threat: SSRF / path injection via product slug

- The slug is validated against `^[a-z0-9][a-z0-9-]{0,99}$` **before** it is
  placed in an API URL, and `encodeURIComponent`'d on top. A slug can't escape
  the products path or point the fetch at an internal address.

## Threat: open redirect at checkout

- The checkout redirect target is a **hardcoded** `academy.founderplus.id`
  origin. The client never supplies the redirect URL — it only supplies a slug.
  An attacker can't turn the buy button into an open redirect.

## Threat: paywall bypass

- The gate decision runs **server-side** in the route loader (`checkGate`). The
  client receives only the result (`allow`/`login`/`pay`), not bypassable state.
- `AUTH_DEV_BYPASS` is ignored when `NODE_ENV=production`, so a stray `true`
  can't open the gate in prod.

## Threat: secret leakage

- There are **no secrets** in this app. Auth is cookie-based; no API key is
  stored. `wrangler.jsonc` `vars` hold only public config (API base, slug,
  project id). If you add a secret later, use `wrangler secret put` — never
  `vars` (which ship to the client-readable build).

## Owner / staff bypass — intentional, scoped

- The owner bypass (`evaluateGate` reason `owner`) only matches products the
  logged-in user actually created, checked via their **own** authenticated
  session against `creator/products`. It grants no cross-user access.
- Staff bypass matches `@founderplus.id` emails. Change `staffDomain` or remove
  it if you don't want Founder+ staff to bypass your paywall.

## Your responsibilities

- Keep dependencies updated (`npm audit`).
- Serve only over HTTPS (Cloudflare does this by default).
- Don't log the `Cookie` / `Set-Cookie` headers.
- If you add forms that mutate state, rely on the SameSite cookie + same-origin
  server functions; add a CSRF token if you introduce cross-origin POSTs.
