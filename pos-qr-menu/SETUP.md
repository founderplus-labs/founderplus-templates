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
| `tables.html` | **Kamu (owner)** | Generate + print QR untuk tiap meja. Buka di browser, klik Print/PDF, potong, tempel di meja. |
| `qrcode.vendor.js` | — | Encoder QR offline (MIT, tanpa CDN pihak ketiga). Dipakai `tables.html`. |

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
  { id: "kopi-susu", name: "Kopi Susu", desc: "…", price: 22000, category: "Kopi", available: true },
  // set available:false untuk item habis
];
```

`price` = angka rupiah polos (tanpa titik/koma). `id` harus unik.

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

## 4. (Opsional) Sambungkan ke POS Founder+

Saat endpoint POS backend sudah aktif, isi `CONFIG.posApi`:

```js
posApi: "https://api.founderplus.id/creator/pos/orders",
```

Pesanan akan di-`POST` sebagai JSON:

```json
{
  "table": "A1",
  "items": [
    { "id": "kopi-susu", "name": "Kopi Susu", "qty": 2, "price": 22000, "subtotal": 44000 }
  ],
  "total": 44000,
  "customer": "Budi",
  "note": "es sedikit"
}
```

Kalau `posApi` gagal atau kosong, halaman **otomatis fallback ke WhatsApp** —
pesanan tidak pernah hilang diam-diam.

> Environment mengikuti CLI: production `api.founderplus.id`, dev
> `ops.founderplus.id`. Ganti host `posApi` sesuai environment yang kamu pakai.

## Catatan

- **Tanpa data pelanggan yang bocor:** QR dibuat 100% di browser (offline). Tidak ada URL meja yang dikirim ke layanan pihak ketiga.
- **Harga tampil apa adanya** dari `MENU`. Untuk pembayaran online end-to-end (bukan bayar di kasir), pakai template `static-landing`/`fp-fullstack` yang wired ke checkout Founder+.
- **Reservasi & manajemen meja** (status meja, buka/tutup sesi per meja, service management) menyusul lewat backend POS + app desktop/mobile Founder+.
