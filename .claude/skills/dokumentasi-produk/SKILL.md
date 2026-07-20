---
name: dokumentasi-produk
description: >
  Menyusun dokumentasi produk untuk repo ini, yang sekaligus jadi sumber konten.
  Pakai saat diminta "dokumentasikan produk ini", "isi wawancara repo",
  "bikin dokumen produk", "apa yang kita punya di repo ini", atau saat menyiapkan
  bahan konten "Baru di [produk]". Jangan pakai untuk dokumentasi teknis internal
  seperti README pengembang atau catatan arsitektur.
---

# Dokumentasi produk

Bahan lengkap ada di `docs/produk/`. Baca `docs/produk/PANDUAN.md` lebih dulu.

## Aturan yang mengikat

**Jangan tanya apa yang sudah bisa dibuktikan kode.** Bagian A di
`docs/produk/wawancara.md` sudah terisi dari pindaian. Verifikasi kalau ragu,
jangan isi ulang.

**Badan dokumen ditulis untuk orang luar.** Publish-safe sejak kalimat pertama.
Penilaian internal masuk bagian bertanda `<!-- INTERNAL`.

**Jangan mengarang.** Kalau tidak ada bukti, tulis "belum diketahui" atau
"belum diverifikasi". Klaim "sudah hidup" wajib punya cara verifikasi yang
bisa diulang orang lain.

**Diagram pakai Mermaid.** Bukan ASCII, bukan tangkapan layar diagram.

**Jangan menebak pembeli.** Pembeli tebakan menghasilkan produk tebakan.

## Urutan

1. `docs/produk/wawancara.md` — jawab bagian B (7 pertanyaan)
2. `status_wawancara: terisi`
3. Susun dokumen dari `docs/produk/template-dokumen.md`
4. Periksa dengan gerbang mutu di `docs/produk/sop-dokumentasi.md`

## Gerbang mutu

Dokumen keluar dari `draft` kalau: kalimat pembuka bisa dipahami orang luar,
tidak ada hal terlarang di badan, bukti hidup punya cara verifikasi, bagian
"Yang TIDAK dilakukan" terisi, tiap gambar punya teks alternatif, tidak ada
data pelanggan di gambar, diagram Mermaid, dan bagian Internal terisi.
