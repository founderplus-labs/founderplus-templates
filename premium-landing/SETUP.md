# Premium Landing — template landing gelap, premium, no-build

Satu file HTML. Landing page premium bertema gelap dengan animasi scroll yang halus.
**Desain & aset 100% orisinal + self-contained** — ikon inline SVG, "gambar" dibuat
dengan CSS (gradient), tanpa font/aset dari pihak ketiga. Aman kamu host & jual sebagai
milikmu.

## Isi

| File | Fungsi |
|------|--------|
| `index.html` | Seluruh halaman: header, hero, fitur, angka, harga, CTA, footer. |

## 3 langkah

### 1. Ganti isi
Buka `index.html`, ubah teks yang ditandai `TODO` + isi tiap section (hero, fitur,
angka, harga, footer). Semua teks Bahasa Indonesia, gampang diganti.

### 2. Ganti warna brand
Di `:root` (blok `<style>`), ubah satu token:

```css
--accent: #8b5cf6;   /* ganti ke warna brand-mu */
```

Semua tombol utama, glow hero, dan aksen ikut berubah. Latar & permukaan gelap sudah
tokenized (`--bg`, `--panel`, dst.) kalau mau disetel lebih jauh.

### 3. Publish
```bash
fp sites publish index.html
```
Atau host di mana saja (Cloudflare Pages / Netlify / GitHub Pages) — tanpa build,
tanpa server.

## Animasi

- **Hero** naik saat load (`rise`, easing kustom).
- **Section** muncul saat scroll (`.reveal` + IntersectionObserver → CSS transition).
- **Angka** count-up saat terlihat.
- Semuanya menghormati `prefers-reduced-motion` (gerak dikurangi, bukan dimatikan).

## (Opsional) Analytics / GTM Founder+

Di akhir `<script>`, isi `FP_PROJECT_ID` untuk memuat funnel-tracker Founder+
(analytics + atribusi UTM) — sama seperti template lain. Kosongkan untuk mematikannya
(default: tanpa call eksternal).

## Catatan

- **Self-contained:** tidak ada aset/URL pihak ketiga. Loading instan, tanpa dependency.
- **Aksesibel:** kontras tinggi, hormati reduced-motion, tautan keyboard-friendly.
- Untuk halaman jualan dengan checkout, pakai `static-landing` / `fp-fullstack`
  (wired ke checkout Founder+).
