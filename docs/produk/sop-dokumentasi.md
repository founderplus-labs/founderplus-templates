# SOP Dokumentasi Produk

> Disalin dari vault `agent-changelog` pada 2026-07-20. Sumber kebenaran ada di sana.
# SOP Dokumentasi Produk

Satu produk, satu berkas. Template: `_templates/product-doc.md`.

## Prinsip: dokumentasi adalah kontennya

Ini yang membedakan SOP ini dari dokumentasi teknis biasa.

Kita tidak menulis dokumen internal lalu menulis ulang jadi konten. **Dokumen produknya sendiri yang jadi sumber konten**, persis model 37signals yang sudah jadi rencana kuartal ini di [[2026-06-16_product_q3-content-plan-low-effort]].

Akibatnya untuk cara menulis:

- **Badan dokumen ditulis untuk orang luar.** Bukan untuk tim, bukan untuk engineer.
- **Publish-safe sejak kalimat pertama.** Bukan disaring belakangan.
- **Penilaian internal dipisah** ke bagian bertanda `Internal` di bawah, yang dibuang saat terbit.
- **Riwayat perubahan adalah antrean konten.** Tiap baris baru di sana adalah satu calon "Baru di [produk]" untuk Pilar A.

Kalau dokumennya cuma bisa dibaca orang dalam, dia gagal dua kali sekaligus: gagal jadi dokumentasi, gagal jadi konten.

## Pemicu menulis: capture-on-ship

Jangan jadwalkan sesi menulis dokumentasi. Itu selalu kalah dari kerjaan lain.

| Kejadian | Yang dilakukan |
|---|---|
| Fitur di-ship | Tambah satu baris di Riwayat perubahan |
| Produk baru hidup di suatu domain | Buat dokumen dari template |
| Status domain berubah | Perbarui Bukti hidup + `terverifikasi` |
| Harga atau pembeli jadi jelas | Isi bagian Internal |
| Baris riwayat layak jadi konten | Set `konten_layak: true` |

Penanda `konten_layak` itu yang menyambung ke pipeline Pilar A di rencana konten. Sekali ditandai, bahan skripnya sudah ada — tidak perlu menulis ulang apa pun.

## Di mana berkasnya

```
wiki/concepts/product/produk/{slug}.md      dokumen produk
raw/product/_assets/{slug}/                 gambar milik produk itu
```

Nama berkas pakai slug huruf kecil berstrip. Frontmatter memakai kosakata yang sama dengan registry repo (`lini`, `repo`), supaya bisa disambungkan tanpa menulis ulang.

## Aturan publish-safe

Diambil dari rencana konten Juni, berlaku sama di sini.

**Boleh publik:** fitur, cara pakai, demo, manfaat buat pemakai, batas kemampuan, cara verifikasi.

**Jangan pernah publik:** strategi monetisasi, funnel, upsell, harga atau margin internal, roadmap yang belum diumumkan, isi dokumen strategi, nama klien tanpa izin, dan apa pun yang ditandai terbatas oleh Head of Product.

**Kalau ragu, jawabannya tidak.** Taruh di bagian Internal, tanyakan Huda.

Bagian `Internal` dipisahkan komentar HTML dan dibuang saat terbit. Pemisahnya cuma disiplin, bukan sistem — jadi jangan menaruh sesuatu di sana yang benar-benar tidak boleh bocor.

## Aturan gambar

### Kapan wajib ada

**Satu tangkapan layar utama**, kalau produk punya antarmuka yang pemakai harus kenali. Satu, bukan galeri.

**Diagram Mermaid**, kalau alurnya bercabang atau melewati lebih dari dua sistem. Tulis sebagai kode, jangan gambar diagram lalu di-screenshot — diagram gambar tidak bisa dicari, tidak bisa di-diff, dan mati begitu alurnya berubah.

**Rekaman layar mentah**, kalau baris riwayat perubahan ditandai `konten_layak`. Ini bahan Pilar A, dan mentah memang cukup — rencana Juni sudah menetapkan tidak ada produksi.

### Kapan jangan

**Hiasan.** Kalau gambar dihapus dan pembaca tidak kehilangan apa-apa, memang tidak perlu ada.

**Antarmuka yang berubah tiap pekan.** Teks bertahan, tangkapan layar jadi bohong dalam sebulan tanpa ada yang sadar.

**Ada data pelanggan di layar.** Nama, email, nominal, nomor telepon. Sensor dulu atau pakai akun contoh. Ini soal data orang lain, bukan preferensi.

**Arsitektur dan alur.** Pakai Mermaid. Vault sudah melarang ASCII box art, dan tangkapan layar diagram sama buruknya.

**Menggantikan kalimat.** Kalau bisa dijelaskan satu kalimat, tulis kalimatnya.

### Cara menaruhnya

Simpan di `raw/product/_assets/{slug}/`, jangan di sebelah note. Obsidian di vault ini belum dikonfigurasi folder attachment, jadi kalau di-drag begitu saja gambarnya jatuh sembarangan.

Nama berkas: `YYYY-MM-DD_{slug}_{apa}.png`

```
raw/product/_assets/intel-iklan-kompetitor/2026-07-20_intel-iklan-kompetitor_layar-utama.png
```

Tanggal di nama bukan hiasan. Itu yang bikin ketahuan kalau gambarnya sudah dua tahun sementara antarmukanya sudah beda.

### Teks alternatif wajib

```markdown
![Hasil pencarian iklan kompetitor, tiga kolom: merek, salinan iklan, tanggal tayang](path.png)
```

Jelaskan **apa yang terlihat**, bukan tulis "screenshot". Teks alternatif yang benar bikin dokumen tetap berguna waktu gambar gagal dimuat, dan bikin bisa dicari.

## Aturan isi

**Bukti dulu, klaim belakangan.** Tiap klaim "sudah hidup" harus punya cara verifikasi yang bisa diulang orang lain. Kalau tidak ada, tulis "belum diverifikasi".

**Kemampuan, bukan fitur.** Kemampuan bisa dijelaskan ke pemakai. Fitur cuma bisa dijelaskan ke engineer.

**Batas ditulis eksplisit.** Bagian "Yang TIDAK dilakukan" wajib diisi.

**Jangan menebak pembeli.** Kalau belum tahu, tulis "belum diketahui" di bagian Internal. Pembeli tebakan menghasilkan produk tebakan.

## Gerbang mutu

Dokumen keluar dari `draft` kalau lolos semua:

1. Kalimat pembuka bisa dipahami orang luar tanpa istilah internal
2. Badan dokumen tidak memuat satu pun hal yang dilarang publik
3. Bukti hidup punya cara verifikasi yang bisa diulang, atau ditulis "belum ada"
4. "Yang TIDAK dilakukan" terisi
5. Tiap gambar punya teks alternatif yang menjelaskan isinya
6. Tidak ada data pelanggan di gambar manapun
7. Diagram pakai Mermaid
8. Bagian Internal terisi, termasuk "Yang belum terjawab"

Belum lolos berarti tetap `draft`. Itu wajar, dan lebih baik daripada dokumen rapi yang isinya tebakan.

## Kaitan

- [[2026-06-16_product_q3-content-plan-low-effort]] — rencana konten yang dokumen ini jadi sumbernya
- [[repo-map]] — peta produk dan registry repo
- `_templates/product-doc.md` — templatenya
