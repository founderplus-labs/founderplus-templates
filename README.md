# Founder+ Templates

Production-ready app starters wired to **Founder+ auth + product checkout** —
ship a paywalled product without writing any payment code. Founder+ hosts login
and checkout; your app just gates content by product ownership.

> The maker can always access their own product (owner bypass), so you can test
> the real flow without buying from yourself.

## Templates

| Name | Stack | What you get |
|------|-------|--------------|
| **`static-landing`** | HTML · no-build | One-file sell page + funnel-tracker buy button. Zero server. Lowest friction — deploy with `fp sites publish`. |
| **`pos-qr-menu`** | HTML · no-build | Dine-in **POS suite**: customers scan a per-table QR → menu → order (table attached). Plus a **cashier** (`kasir.html`) — enter amount/items → show **dynamic QRIS** → print an **ESC/POS Bluetooth receipt** (customizable) — and an offline per-table QR print tool. |
| **`ai-studio`** | Google AI Studio · static · CDN | Product-specific prompts → Gemini generates a static selling page wired to the Founder+ CDN checkout. |
| **`fp-fullstack`** | TanStack Start · Cloudflare · Tailwind · React 19 | Login + product gate + checkout + tracking. Full app. |
| **`astro`** | Astro SSR · Cloudflare | Login + gate + checkout. Content + interactive islands. |
| **`nextjs`** | Next.js App Router · Node/Vercel | Login + gate + checkout. Server Component gate. Biggest ecosystem. |
| **`hono`** | Hono · Cloudflare Workers | Minimal edge app, JSX HTML, no client framework. |

Every gated template ships with `SETUP.md` (wiring) and `SECURITY.md`
(MITM / cookie / paywall posture). All share the same vendored
`founderplus-auth.ts` (owner bypass) and `founderplus-checkout.ts`
(slug-validated, no open redirect).

---

## Use it — 3 ways

### 1. Founder+ CLI (recommended)

```bash
# install the CLI once
curl -fsSL https://academy.founderplus.id/install.sh | sh

fp new my-app --template fp-fullstack
cd my-app
cp .env.example .env       # set FOUNDERPLUS_PRODUCT_SLUG
npm install
npm run dev
```

`fp new` fetches this repo's `index.json`, scaffolds the files, and prints the
setup steps. List what's available:

```bash
fp new --list
fp new info fp-fullstack
```

### 2. degit (no CLI)

```bash
npx degit founderplus-labs/founderplus-templates/fp-fullstack my-app
cd my-app && npm install && cp .env.example .env
```

### 3. Manual

Browse `fp-fullstack/`, copy what you need. Start with `SETUP.md`.

---

## After scaffolding

1. **Create the product** you want to sell (or reuse one):
   ```bash
   fp products create --title "My Product" --price 99000 --status draft \
     --delivery "type=link,label=Akses App,url=https://my-app.example/"
   fp products list      # copy the slug
   ```
2. Put the slug in `.env` → `FOUNDERPLUS_PRODUCT_SLUG`.
3. `npm run dev`, log in with the account that **created** the product → you're
   in (owner access, no purchase needed). Log in with another account → paywall.
4. Read `SECURITY.md`, then `npm run deploy` (Cloudflare) or
   `fp sites publish` to host.founderplus.id.

---

## How auth + payment work (no Stripe)

- **Auth** — `src/lib/founderplus-auth.ts` is the vendored `@founderplus/auth`
  client (vendored, not npm-installed, for Cloudflare Workers bundling). It
  proxies the user's session cookie to `academy.founderplus.id` server-side.
- **Payment** — `src/lib/buy-server.ts` fetches the product, then redirects to
  the Founder+ checkout (`academy.founderplus.id/payment`). Founder+ processes
  payment (Midtrans). You store no card data and run no webhook.
- **Tracking** — `funnel-tracker.js` from `cdn.founderplus.id` (loaded at the
  end of `<body>`) captures UTM and wires product clicks.

For Node/Next/Express apps (non-Workers), `npm install @founderplus/auth`
instead of vendoring.

## Catalog format

`index.json` lists each template with per-file `sha256` digests. The CLI uses
the digests for integrity + change detection. Files are served from this repo's
`main` branch via `raw.githubusercontent.com`.

## Contributing a template

1. Add `your-template/` with the files.
2. Regenerate `index.json` (digests + raw URLs).
3. PR. Keep a `SETUP.md` + `SECURITY.md` in every template.
