# Setup — Next.js Starter

Next.js App Router with Founder+ login + product gate + checkout. Runs on
Node (Vercel, self-host). The gate is a Server Component decision.

## Steps (agent: ask the user each)

1. **Produk yang di-gate?** punya slug → `fp products list`; belum → `fp products create ...` salin slug.
2. `cp .env.example .env` → isi `FOUNDERPLUS_PRODUCT_SLUG`.
3. `npm install && npm run dev` → http://localhost:3000
4. Verifikasi: belum login → "Masuk dulu" · login pembuat → akses `owner` tanpa beli · login lain belum beli → "terkunci" + beli.

## npm vs vendored
Template ini **vendor** `src/lib/founderplus-auth.ts` (sama source `@founderplus/auth`)
karena versi vendored ini punya **owner bypass** + HTTPS guard. Kalau gak butuh
owner bypass, bisa ganti ke `npm install @founderplus/auth` + import dari package.

## Cookie note (Next RSC)
Login/logout/checkout lewat route handlers (`app/api/*`) yang boleh set cookie.
Auto-refresh cookie saat render Server Component tidak dipersist (limitasi Next
RSC) — request berikutnya re-verify. Aman untuk pola ini.

## File penting
- `src/lib/founderplus-auth.ts` (auth client, owner bypass)
- `src/lib/auth.ts` (gate, read-only cookie)
- `src/lib/founderplus-checkout.ts` (checkout URL, slug-validated)
- `src/app/page.tsx` (gated) · `login/page.tsx` · `api/{login,logout,checkout}/route.ts`

## Deploy
`npm run build && npm start`, atau Vercel. HTTPS wajib. Baca `SECURITY.md`.
