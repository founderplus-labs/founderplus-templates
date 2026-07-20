# Booking — janji temu jasa

Satu file HTML. Pelanggan **pilih layanan → tanggal → slot jam → isi data →
konfirmasi via WhatsApp**. Orisinal & self-contained.

## 3 langkah

1. **Edit `BUSINESS`** — nama usaha, nomor `whatsapp` (format 62…).
2. **Edit `SERVICES`** — tiap layanan: `id`, `name`, `duration` (menit), `price`.
3. **Edit `HOURS`** — `open`, `close` (format `"09:00"`), `slotMinutes` (panjang
   slot), `closedDays` (0=Minggu … 6=Sabtu).

Publish: `fp sites publish index.html`.

## Cara kerja
- Slot jam dibuat otomatis dari jam operasional; slot yang sudah lewat (hari ini)
  & hari tutup disembunyikan.
- Tombol konfirmasi aktif setelah layanan + jadwal + nama terisi → membuka
  WhatsApp dengan ringkasan booking ke nomormu.
- Ganti warna via `--accent`. Isi `BUSINESS.founderplus.projectId` untuk analytics
  (GTM Founder+); kosong = mati.

Untuk kelola tiket/antrean sisi owner, pasangkan dengan `pos-qr-menu` → `servis.html`.
