# Integration Spec — pos-qr-menu

Template ini **kamu host sendiri** (upload ke domain/hosting milikmu). Wiring-nya
**spec-driven**: semua integrasi dideklarasikan lewat config, tidak ada endpoint
yang di-hardcode di logika. Yang berjalan di **Founder+ (kita)** cuma dua hal:

| Domain | Pemilik | Keterangan |
|--------|---------|------------|
| Frontend (HTML/CSS/JS), konten menu, hosting, branding | **User** | Kamu upload & host sendiri. |
| Data lokal owner (riwayat kasir, status meja, reservasi, tiket servis) | **User (device)** | Tersimpan di browser perangkat (localStorage). Belum tersinkron antar-device. |
| **Transaksi** (checkout, QRIS, pesanan POS) | **Founder+** | Uang & order diproses Founder+. |
| **Growth / GTM** (analytics, atribusi UTM, funnel) | **Founder+** | funnel-tracker di `cdn.founderplus.id`. |

Prinsipnya: **user owns the storefront; Founder+ owns money + growth.**

---

## 1. Config contract

Satu blok deklaratif di `index.html` → `CONFIG.founderplus`:

```js
founderplus: {
  env: "prod",       // "prod" → api.founderplus.id · "dev" → ops.founderplus.id
  projectId: "",     // GTM: id project funnel-tracker (analytics + atribusi). Kosong = off.
  orders: false,     // true → kirim pesanan ke backend POS Founder+ (default: WhatsApp)
}
```

Endpoint diturunkan dari `env` (bukan URL yang disebar di kode):

```js
const FP_ENVS = { prod: "https://api.founderplus.id", dev: "https://ops.founderplus.id" };
const FP_API  = FP_ENVS[CONFIG.founderplus.env];
const POS_ORDERS = CONFIG.founderplus.orders ? `${FP_API}/creator/pos/orders` : null;
```

Environment ini **sama** dengan CLI/desktop/mobile Founder+ (prod = `api.founderplus.id`,
dev = `ops.founderplus.id`).

---

## 2. Transaksi → Founder+

Jalur uang tidak pernah ditangani sendiri oleh template; selalu ke Founder+:

**a. Pesanan meja (customer, `index.html`).**
Kalau `founderplus.orders = true`, pesanan di-`POST` ke `POS_ORDERS`:

```
POST {FP_API}/creator/pos/orders
Content-Type: application/json

{ "table": "A1", "items": [ { "id", "name", "qty", "price", "subtotal" } ],
  "total": 44000, "customer": "Budi", "note": "es sedikit" }
```

Response `2xx` = diterima. Gagal / `orders=false` → **fallback WhatsApp** (pesanan tak
pernah hilang).

**b. QRIS (kasir, `kasir.html`).**
QRIS dinamis dibangun dari **payload QRIS statis merchant** (akun QRIS milikmu di
Founder+ / penyedia) — nominal ditanam + CRC16 dihitung ulang. Settlement lewat
jaringan QRIS/acquirer, bukan template. Template hanya me-render QR.

**c. Checkout produk (opsional).**
Untuk jual produk (bukan bayar di kasir), pakai funnel-tracker `data-product-*`
atau template `static-landing` / `fp-fullstack` — checkout diproses Founder+.

> Batas: template TIDAK menyimpan kartu, tidak memproses pembayaran sendiri, tidak
> menyimpan kredensial acquirer. Semua itu di sisi Founder+.

---

## 3. Growth / GTM → Founder+

`index.html` memuat funnel-tracker Founder+ **hanya jika `projectId` diisi**:

```html
<script src="https://cdn.founderplus.id/funnel-tracker.js"
        data-project-id="<PROJECT_ID>" defer></script>
```

Template menyuntik script ini secara terprogram dari `CONFIG.founderplus.projectId`
(env `dev` → tambah `data-api-base="https://ops.founderplus.id"`). Yang ditangani
tracker: capture UTM/atribusi, event analytics, wiring checkout, lead capture —
semua ke backend GTM Founder+. Repo: `founderplus-labs/funnel-tracker-cdn`.

---

## 4. Yang tetap lokal (device)

Tool owner berjalan penuh di perangkat, tanpa server:

- `kasir.html` — riwayat transaksi + rekap harian (localStorage `fp_kasir_txns_v1`, settings `fp_kasir_settings_v1`).
- `meja.html` — status meja + reservasi (`fp_meja_v1`).
- `servis.html` — tiket servis (`fp_servis_v1`).

Ini **by design** untuk versi template. Sinkron multi-device (kasir HP A = tablet B)
menyusul lewat backend POS Founder+ — kontraknya: tipe di
`founderplus-cli` `core/pos.ts` (`PosTable`, `Reservation`, `PosOrder`,
`ServiceTicket`, `POS_ENDPOINTS`), relatif terhadap `FP_API` yang sama.

---

## 5. Deploy (milik user)

```bash
fp sites publish index.html      # atau host di mana saja (Cloudflare Pages / Netlify / dsb.)
```

Hanya `index.html` (customer) yang perlu publik. `kasir.html` / `meja.html` /
`servis.html` / `tables.html` cukup dibuka di perangkat owner (bisa juga di-host,
tapi tanpa auth — jangan taruh di URL publik yang gampang ditebak).

---

## 6. Checklist go-live

- [ ] `CONFIG.storeName`, `whatsapp`, `MENU` diisi (`index.html`).
- [ ] `founderplus.projectId` diisi (aktifkan GTM) — dari dashboard Founder+.
- [ ] `founderplus.env` = `prod` untuk live.
- [ ] (Opsional) `founderplus.orders = true` kalau backend POS sudah aktif untuk akunmu.
- [ ] Payload QRIS statis dipasang di `kasir.html` → Pengaturan (uji 1× bayar nominal kecil).
- [ ] Rekening bank diisi (kalau pakai Transfer).
- [ ] Uji cetak struk ke printer Bluetooth fisik (Android Chrome).
