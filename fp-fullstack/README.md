# Founder+ Fullstack Starter

Production-ready paywalled app: **Founder+ login + product entitlement gate +
checkout**, no payment code of your own. TanStack Start + Cloudflare + Tailwind.

- **Auth** — `src/lib/founderplus-auth.ts` (vendored for Workers compat)
- **Payment** — Founder+ checkout via `src/lib/buy-server.ts` + `funnel-tracker.js`.
  You never touch a payment processor; Founder+ handles it.
- **Owner access** — the product creator can access their own product without
  buying. See `SETUP.md`.

## Quick start

```bash
npm install
cp .env.example .env        # set FOUNDERPLUS_PRODUCT_SLUG
npm run dev                 # http://localhost:3000
```

Read **`SETUP.md`** first (it walks you through creating the product + wiring
the gate) and **`SECURITY.md`** before deploying.

## How the gate works

`/` runs `checkGate()` server-side → `allow` (show content) / `login` / `pay`
(start checkout). The decision never reaches the client as bypassable state.

## Deploy

```bash
npm run deploy              # Cloudflare (wrangler)
# or: npm run build && fp sites publish <zip>   → host.founderplus.id
```
