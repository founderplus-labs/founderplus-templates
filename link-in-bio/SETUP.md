# Link-in-bio — microsite kreator

Satu file HTML. Halaman "link in bio" premium: avatar, bio, sosial, dan tombol
tautan. **Orisinal & self-contained** (avatar & ikon dari CSS/SVG, tanpa aset
pihak ketiga).

## 3 langkah

1. **Edit `PROFILE`** di `<script>` — nama, handle, bio, foto (opsional), WhatsApp,
   daftar `socials`.
2. **Edit `LINKS`** — tiap item bertipe:
   - `link` — tautan biasa (`url`).
   - `whatsapp` — buka chat WA.
   - `product` — checkout **Founder+** (`productSlug`, `productType`, `price`).
   `feature: true` menjadikan tombol sorot; `price` menampilkan label harga.
3. **Publish**: `fp sites publish index.html` (atau host di mana saja).

## Warna & analytics
- Ganti brand lewat token `--accent` di `:root`.
- Isi `PROFILE.founderplus.projectId` untuk analytics/atribusi (GTM Founder+).
  Kosong = mati (tanpa call eksternal).

Transaksi (checkout produk) diproses **Founder+**. Foto & data tetap milikmu; tak
ada aset dari pihak ketiga.
