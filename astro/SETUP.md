# Setup — Astro Starter

Astro (SSR) on Cloudflare with Founder+ login + product gate + checkout.

## Steps (agent: ask the user each)

1. **Produk yang di-gate?** punya slug → `fp products list`; belum → `fp products create ...` lalu salin slug.
2. `cp .env.example .env` → isi `FOUNDERPLUS_PRODUCT_SLUG`.
3. `npm install && npm run dev` → http://localhost:4321
4. Verifikasi:
   - belum login → redirect `/login`
   - login akun **pembuat produk** → akses terbuka (`owner`, tanpa beli)
   - login akun lain belum beli → "Konten terkunci" + tombol beli

## Owner access
Gate (`src/lib/founderplus-auth.ts` → `evaluateGate`, `allowOwner: true`) cek
`creator/products` pakai sesi user → kalau user yang bikin produk, akses dibuka
tanpa beli. Matikan: `allowOwner: false` di `src/lib/auth.ts`.

## File penting
- `src/lib/founderplus-auth.ts` — auth client (vendored, owner bypass)
- `src/lib/auth.ts` — Astro glue (gate + cookie forwarding)
- `src/lib/founderplus-checkout.ts` — checkout URL builder (slug-validated)
- `src/pages/index.astro` — gated page · `login.astro` · `api/{login,logout,buy}.ts`

## Deploy
`npm run deploy` (Cloudflare via wrangler). Baca `SECURITY.md` dulu.
