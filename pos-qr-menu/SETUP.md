# POS QR-Menu — scan meja, lihat menu, pesan

Menu digital per-meja untuk kafe/resto/warung. Pelanggan **scan QR di mejanya →
lihat menu → pesan dari HP**. Nomor meja ikut terbawa di setiap pesanan, jadi
dapur/kasir tahu pesanan itu dari meja mana. Tanpa build, tanpa server —
satu file HTML.

> Cocok untuk **POS onsite** (dine-in). Jalur pesanan default lewat **WhatsApp**
> (langsung bekerja hari ini). Kalau backend POS Founder+ sudah aktif, tinggal
> isi satu URL untuk kirim pesanan ke sistem POS.

## Isi folder

| File | Untuk siapa | Fungsi |
|------|-------------|--------|
| `index.html` | **Pelanggan** | Halaman menu + keranjang + kirim pesanan. Baca nomor meja dari URL (`?meja=A1`). |
| `kasir.html` | **Kamu (owner)** | Kasir: input nominal/barang → bayar (QRIS/transfer/tunai) + bukti → struk Bluetooth. Plus **riwayat + rekap harian**. |
| `meja.html` | **Kamu (owner)** | **Status meja** (kosong/terisi/reserved/bersihin) + **reservasi** (booking meja). |
| `servis.html` | **Kamu (owner)** | **Manajemen servis**: tiket kerjaan, jadwal, status pengerjaan — untuk usaha jasa apa pun. |
| `tables.html` | **Kamu (owner)** | Generate + print QR untuk tiap meja. Buka di browser, klik Print/PDF, potong, tempel di meja. |
| `qrcode.vendor.js` | — | Encoder QR offline (MIT, tanpa CDN pihak ketiga). Dipakai `kasir.html` + `tables.html`. |
| `SPEC.md` | — | **Kontrak integrasi** (spec-driven): apa yang milik user vs. Founder+ (transaksi + GTM), env, bentuk endpoint. |

> Semua tool owner (`kasir`/`meja`/`servis`) **jalan lokal di HP/tablet, tanpa server** — datanya
> tersimpan di browser perangkat itu (localStorage). Sinkronisasi multi-perangkat menyusul
> lewat backend POS Founder+.

## 3 langkah

### 1. Edit menu + kontak
Buka `index.html`, ubah blok `CONFIG` dan `MENU` di dalam `<script>`:

```js
const CONFIG = {
  storeName: "Warung Kopi Kamu",
  currency: "IDR",
  whatsapp: "628123456789",   // WA kasir/dapur, format 62… tanpa +
  posApi: null,               // biarkan null dulu (lihat langkah 4)
  tableParams: ["meja", "table", "t"],
};

const MENU = [
  { id: "kopi-susu", name: "Kopi Susu", desc: "…", price: 22000, category: "Kopi",
    available: true, image: "https://…/kopi.jpg", icon: "coffee" },
  // set available:false untuk item habis
];
```

- `price` = angka rupiah polos (tanpa titik/koma). `id` harus unik.
- `image` (opsional) = URL foto produk. Kalau kosong, tampil **placeholder
  gradient + ikon** otomatis — menu tetap rapi sebelum kamu pasang foto.
  Foto asli sangat disarankan: pelanggan memilih lewat gambar.
- `icon` (opsional) = ikon placeholder per item: `coffee` | `cup` | `food`
  (default ikut kategori di `CONFIG.categoryIcon`). Ikon SVG line, bukan emoji.

### 2. Publish halaman menu
```bash
fp sites publish index.html
```
Catat URL hasilnya, mis. `https://warungkopi.host.founderplus.id`.

> Alternatif tanpa CLI: host `index.html` di mana saja (Cloudflare Pages,
> Netlify, GitHub Pages). Hanya `index.html` yang perlu di-publish untuk
> pelanggan; `tables.html` cukup dijalankan lokal untuk cetak QR.

### 3. Cetak QR per meja
Buka `tables.html` di browser (dobel-klik file-nya). Isi:
- **Nama tempat**, **URL menu** (dari langkah 2), **Jumlah meja**, dan **Prefix** opsional (mis. `A` → `A1, A2, …`).

Klik **Buat** lalu **Print / PDF**. Tiap kartu berisi QR yang membuka
`…/?meja=<nomor>`. Potong, laminasi, taruh di meja. Selesai — pelanggan tinggal scan.

## 4. Integrasi Founder+ (spec-driven)

Kamu host template ini sendiri. Yang lewat **Founder+ (kita)**: **transaksi** +
**growth/GTM**. Wiring-nya deklaratif di satu blok `CONFIG.founderplus` (`index.html`):

```js
founderplus: {
  env: "prod",       // "prod" → api.founderplus.id · "dev" → ops.founderplus.id
  projectId: "",     // GTM: id project funnel-tracker (analytics + atribusi). Kosong = off.
  orders: false,     // true → kirim pesanan ke backend POS Founder+ (default: WhatsApp)
},
```

- **Transaksi** — `orders: true` → pesanan meja di-`POST` ke `{api}/creator/pos/orders`
  (gagal/kosong → fallback WhatsApp). QRIS di kasir juga rail Founder+ (dari payload
  QRIS statis merchant-mu).
- **GTM** — isi `projectId` → `index.html` otomatis memuat funnel-tracker Founder+
  (`cdn.founderplus.id`) untuk analytics + atribusi UTM. Kosongkan untuk mematikannya.
- **Environment** sama dengan CLI: `prod` = `api.founderplus.id`, `dev` = `ops.founderplus.id`.

📄 Detail kontrak lengkap (batas kepemilikan, bentuk endpoint, event tracker,
data lokal) ada di **`SPEC.md`**.

## Kasir — QRIS dinamis + cetak struk (`kasir.html`)

Buka `kasir.html` di HP/tablet (Android Chrome disarankan untuk Bluetooth). Ada 2
mode input: **Nominal** (keypad) atau **Barang** (daftar item). Lalu tekan
**Bayar** dan pilih metode: **QRIS**, **Transfer bank**, atau **Tunai**.

**Transfer bank (nomor rekening sendiri).** Tambah rekeningmu di **Pengaturan → Rekening
bank** (bank, no. rekening, atas nama — boleh lebih dari satu). Saat pilih
Transfer, kasir menampilkan rekening-rekening itu + tombol **Salin** dan nominal
yang harus ditransfer pelanggan.

**Foto bukti pembayaran.** Di layar Transfer/Tunai ada **Lampirkan foto bukti
pembayaran** — potret struk transfer / layar sukses m-banking pelanggan. Bisa
**diganti** atau **diunduh**, dan struk mencatat "Bukti bayar: terlampir". Foto
disimpan di HP ini saja (tidak diunggah ke mana pun).

**Tunai.** Masukkan uang yang diterima (atau tap pecahan cepat) → **kembalian**
dihitung otomatis; struk mencantumkan Tunai + Kembalian.

**Tampilkan QRIS.** Kasir menampilkan QR untuk dibayar pelanggan.
- Buka **Pengaturan → QRIS**, tempel **payload QRIS statis** merchant-mu (teks di dalam
  QRIS statis — scan QRIS-mu sekali pakai app pemindai untuk melihat teksnya,
  atau minta ke penyedia QRIS: GoPay Merchant, OVO, bank, dll).
- Kasir mengubahnya jadi **QRIS dinamis**: nominal ikut tertanam + **CRC16
  dihitung ulang dengan benar** (diverifikasi terhadap test vector EMVCo). QR
  ini valid dibayar karena berasal dari akun QRIS aslimu.
- Kalau payload belum diisi, kasir jujur bilang itu **bukan QRIS** — tampilkan
  QRIS statismu dan minta pelanggan ketik nominalnya. Kami tidak pernah memalsukan
  QRIS yang tidak bisa dibayar.

**Cetak struk (Bluetooth).** Tombol **Struk** mencetak ke printer termal Bluetooth
(ESC/POS).
- Jalan di **Android Chrome / desktop Chrome** (Web Bluetooth). **iOS Safari tidak
  mendukung Web Bluetooth** — di situ otomatis fallback ke dialog **print biasa**
  (AirPrint / simpan PDF), jadi tetap bisa cetak.
- Kustomisasi di **Pengaturan → Struk**: nama toko, alamat/telepon, catatan bawah, dan
  **lebar kertas 58/80 mm** — lengkap dengan **pratinjau struk** langsung.
- Semua pengaturan tersimpan di browser (localStorage) — tak ada yang dikirim keluar.

> QRIS statis→dinamis + struk dibuat 100% di browser. Tidak ada data transaksi yang
> dikirim ke pihak ketiga.

**Riwayat + rekap harian.** Ikon jam di kasir membuka **Riwayat**: total hari ini,
rincian per metode (QRIS/Transfer/Tunai), daftar transaksi, **cetak rekap** (tutup
kasir), **export CSV**, dan hapus. Setiap pembayaran yang selesai otomatis tercatat.

## Status meja + reservasi (`meja.html`)

Buka `meja.html`. Tab **Meja**: grid meja dengan status (kosong/terisi/reserved/
bersihin) — tap meja untuk ubah status. Tab **Reservasi**: tambah booking (nama, HP,
jumlah orang, tanggal-jam, meja) dan ubah statusnya (booking → duduk → selesai /
no-show / batal); booking yang dikaitkan ke meja otomatis menandai meja itu
reserved/terisi. Atur jumlah & prefix meja lewat ikon ⚙.

## Manajemen servis (`servis.html`)

Buka `servis.html` — untuk usaha jasa (bengkel, salon, laundry, servis elektronik,
dll). Tap **+ Servis** untuk buat tiket (jenis kerjaan, pelanggan, HP, harga, jadwal,
catatan, tandai prioritas). Tiap tiket punya kode (S-001…) dan alur status: Baru →
Dijadwalkan → Dikerjakan → Selesai (atau Batal). Filter cepat (Semua/Aktif/Dikerjakan/
Selesai) dan ubah status langsung dari detail tiket.

## Catatan

- **Tanpa data pelanggan yang bocor:** QR dibuat 100% di browser (offline). Tidak ada URL meja yang dikirim ke layanan pihak ketiga.
- **Harga tampil apa adanya** dari `MENU`. Untuk pembayaran online end-to-end (bukan bayar di kasir), pakai template `static-landing`/`fp-fullstack` yang wired ke checkout Founder+.
- **Reservasi & manajemen meja** (status meja, buka/tutup sesi per meja, service management) menyusul lewat backend POS + app desktop/mobile Founder+.
