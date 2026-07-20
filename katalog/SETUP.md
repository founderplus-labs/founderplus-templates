# Katalog — toko online sederhana

Satu file HTML. Grid produk → keranjang → **order via WhatsApp**. Orisinal &
self-contained (placeholder foto dari CSS; opsional foto per-item).

## 3 langkah

1. **Edit `SHOP`** — nama toko, nomor `whatsapp` (format 62… tanpa +), `currency`.
2. **Edit `PRODUCTS`** — tiap item: `id` (unik), `name`, `desc`, `price` (angka
   polos), `category` (untuk filter), `available` (false = habis), `image`
   (opsional, URL foto).
3. **Publish**: `fp sites publish index.html`.

## Cara kerja
- Pelanggan pilih produk → keranjang → **Pesan via WhatsApp** (ringkasan pesanan
  otomatis terformat ke nomormu). Langsung jalan tanpa server.
- Ganti warna brand lewat `--accent`. Isi `SHOP.founderplus.projectId` untuk
  analytics (GTM Founder+); kosong = mati.

Untuk pembayaran online end-to-end (bukan konfirmasi WA), pakai `static-landing` /
`fp-fullstack` yang wired ke checkout Founder+.
