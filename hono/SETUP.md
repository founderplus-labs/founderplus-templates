# Setup — Hono Starter (Cloudflare Workers)

Minimal edge app: Hono on CF Workers with Founder+ login + product gate +
checkout. JSX-rendered HTML, no client framework.

## Steps (agent: ask the user each)

1. **Produk yang di-gate?** punya slug → `fp products list`; belum → `fp products create ...` salin slug.
2. Isi `FOUNDERPLUS_PRODUCT_SLUG` di **`wrangler.jsonc` → vars** (bukan .env — Workers baca dari `c.env`).
3. `npm install && npm run dev` → http://localhost:8787
4. Verifikasi: belum login → "Masuk dulu" · login pembuat → akses `owner` tanpa beli · login lain belum beli → "terkunci" + beli.

## Config
CF Workers tidak baca `.env` saat runtime. Config non-rahasia ada di
`wrangler.jsonc` `vars`. Tidak ada secret (auth cookie-based). Kalau perlu
secret, pakai `wrangler secret put`.

## File penting
- `src/index.tsx` — Hono app (routes + JSX pages)
- `src/founderplus-auth.ts` — auth client (owner bypass)
- `src/founderplus-checkout.ts` — checkout URL (slug-validated)

## Deploy
`npm run deploy` (wrangler). HTTPS otomatis di Workers. Baca `SECURITY.md`.
