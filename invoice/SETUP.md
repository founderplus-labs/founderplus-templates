# Invoice / Kwitansi — generator

Satu file HTML. Isi form → **pratinjau dokumen live** → **Cetak / PDF** atau
simpan draft. Orisinal & self-contained, tanpa server.

## Pakai

1. Buka `index.html` di browser.
2. Pilih mode **Invoice** atau **Kwitansi** (segmented di atas).
3. Isi: **Usaha kamu**, **Ditagih ke**, **Nomor + Tanggal**, **Item** (deskripsi,
   qty, harga — tambah/hapus baris), **Pajak %**, catatan, nama penanda tangan.
4. Dokumen di kanan ter-update otomatis. Klik **Cetak / PDF** → dialog print OS
   (pilih printer atau "Save as PDF").
5. **Simpan** menyimpan draft di browser (localStorage); **Muat** memuatnya lagi.

## Catatan
- Subtotal, pajak, dan total dihitung otomatis. Mata uang bisa diganti (default IDR).
- CSS print menyembunyikan form — hanya dokumen yang tercetak (rapi, margin A4).
- Ganti warna aksen/logo lewat token `--accent`.
- Semua di perangkatmu — tak ada data yang dikirim keluar.
