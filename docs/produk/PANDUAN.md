# Dokumentasi produk — `founderplus-templates`

Paket ini disebar dari vault `agent-changelog` pada 2026-07-20. Tujuannya supaya
pekerjaan dokumentasi bisa dikerjakan di repo ini, bukan di tempat lain.

## Kenapa ada di sini

Sepanjang Juli 2026 kami menemukan kapabilitas yang sudah jalan di produksi tapi
nol tercatat. Bukan karena dokumentasinya berantakan, tapi karena tidak ada bentuk
baku yang memaksa pertanyaan "ini produk atau bukan, buat siapa, dan buktinya mana".

Dan dokumentasi di sini **sekaligus sumber konten**. Bukan dua pekerjaan.

## Urutan kerja

1. **Buka `wawancara.md`.** Bagian A sudah terisi dari pindaian kode dan uji
   jaringan — jangan diisi ulang. Bagian B tujuh pertanyaan yang cuma manusia
   yang tahu jawabannya.

2. **Jawab bagian B.** Kalau ada pertanyaan yang tidak bisa dijawab, tulis
   "belum diketahui". Itu jawaban sah dan lebih berguna daripada tebakan.

3. **Ubah `status_wawancara` jadi `terisi`** di frontmatter `wawancara.md`.

4. **Susun dokumen produk** dari `template-dokumen.md`. Tabel di bagian C
   `wawancara.md` memetakan tiap jawaban ke bagian mana, jadi tidak ada yang
   ditulis dua kali.

5. **Patuhi `sop-dokumentasi.md`** untuk aturan gambar dan publish-safe.

## Aturan yang paling sering dilanggar

- **Badan dokumen ditulis untuk orang luar.** Kalau cuma bisa dibaca orang dalam,
  dia gagal jadi dokumentasi sekaligus gagal jadi konten.
- **Penilaian internal** (harga, ketergantungan, keraguan) masuk bagian bertanda
  `<!-- INTERNAL`, yang dibuang saat terbit.
- **Diagram pakai Mermaid**, jangan ASCII dan jangan tangkapan layar diagram.
- **Jangan menebak pembeli.** Tulis "belum diketahui".

## Balik ke vault

Setelah dokumen produk jadi, salin ke vault di
`wiki/concepts/product/produk/{slug}.md` supaya ikut terindeks bersama produk lain.

Sumber asli paket ini: `agent-changelog/wiki/sop/product/sop-dokumentasi-produk.md`
