# Setup — Founder+ Fullstack Starter

> Untuk agent (Claude Code / Cursor): jalankan langkah ini interaktif. Tanyakan
> ke user tiap pertanyaan, jangan asumsikan. Tujuan akhir: app jalan, ter-gate
> ke 1 produk Founder+, dan **si pembuat bisa langsung akses produknya sendiri**
> tanpa beli.

## Pertanyaan yang HARUS ditanyakan ke user

1. **Produk mana yang mau di-gate?**
   - Sudah punya produk di Founder+? → minta slug-nya (`fp products list`).
   - Belum punya? → bantu buat sekarang:
     ```bash
     fp products create --title "<judul>" --price <harga> --status draft \
       --delivery "type=link,label=Akses App,url=https://<app-domain>/"
     fp products list   # salin slug yang muncul
     ```
   - Isi slug ke `.env` → `FOUNDERPLUS_PRODUCT_SLUG`.

2. **Project id funnel-tracker?** (opsional, buat analytics)
   - Kalau punya, isi `FOUNDERPLUS_PROJECT_ID`. Kalau tidak, kosongkan.

3. **Domain deploy?**
   - Default deploy ke Cloudflare. Update `name` + (opsional) `routes` di `wrangler.jsonc`.

## Owner access — kenapa pembuat bisa langsung masuk

Gate ini (`src/lib/founderplus-auth.ts` → `evaluateGate`) mengizinkan akses
dalam urutan:

1. `bypass` (dev only)
2. login + tidak ada produk wajib → open
3. email `@founderplus.id` (staff)
4. **owner — user yang MEMBUAT produk ini** ← inilah yang bikin pembuat bisa akses sendiri
5. user yang sudah BELI produk

Owner-check memanggil `creator/products` pakai **sesi login user sendiri**
(server-side, tidak ada privilege tambahan). Kalau slug produk ada di katalog
buatan user → akses dibuka. Jadi setelah login dengan akun yang membuat produk,
kamu langsung masuk — tidak perlu beli produk sendiri.

> Tidak mau owner bypass? Set `allowOwner: false` di `checkGate` (`auth-server.ts`).

## Jalankan

```bash
cp .env.example .env     # lalu isi FOUNDERPLUS_PRODUCT_SLUG
npm install
npm run dev              # http://localhost:3000

# verifikasi:
# - buka /  → kalau belum login, muncul "Masuk dulu"
# - login dengan akun pembuat produk → langsung "Akses terbuka [owner]"
# - login dengan akun lain yang belum beli → "Konten terkunci" + tombol Beli
```

## Deploy

```bash
# set var produksi (bukan secret — auth pakai cookie):
npx wrangler deploy
# atau lewat fp:  build → fp sites publish dist.zip
```

## Checklist sebelum production

- [ ] `FOUNDERPLUS_PRODUCT_SLUG` terisi
- [ ] `AUTH_DEV_BYPASS="false"`
- [ ] Domain pakai HTTPS (wajib — cookie sesi butuh TLS)
- [ ] Tes 3 state: belum login / sudah beli / belum beli
- [ ] Tes owner: login akun pembuat → akses tanpa beli
- [ ] Baca `SECURITY.md`
