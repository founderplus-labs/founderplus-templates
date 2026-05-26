# Setup — Static Landing

Zero build. One HTML file that sells a Founder+ product. Founder+ handles
payment; `funnel-tracker.js` wires the buy button and captures UTM.

## Steps (agent: ask the user each)

1. **Produk mana yang dijual?**
   - Punya slug? `fp products list`.
   - Belum? buat:
     ```bash
     fp products create --title "<judul>" --price <harga> --status published \
       --delivery "type=link,label=Akses,url=https://<domain>/terima-kasih"
     fp products list   # salin slug
     ```
2. Edit `index.html`:
   - `data-product-slug="<slug>"` di tombol beli
   - `data-product-type` (`customProduct` untuk produk custom)
   - `data-project-id="<project-id>"` di script funnel-tracker (opsional)
   - Ganti judul, copy, benefit, harga
3. **Deploy** — gak perlu build:
   ```bash
   fp sites publish index.html        # → host.founderplus.id
   ```
   atau drag ke hosting statik apa pun.

## Cara kerja checkout
funnel-tracker.js mendeteksi klik pada `[data-product-slug][data-product-type]`,
fetch detail produk, lalu redirect ke checkout Founder+ (`/payment`). Tidak ada
kode pembayaran di file ini.

## Catatan
Ini halaman JUAL (pra-beli) — tidak ada gating. Kalau butuh konten yang dikunci
setelah beli (login + entitlement), pakai template `fp-fullstack` / `astro` /
`nextjs` / `hono`.
