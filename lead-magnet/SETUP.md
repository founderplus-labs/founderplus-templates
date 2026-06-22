# Setup — Lead Magnet

Zero build. One HTML file that captures a lead and emails them a free asset
(PDF, sheet, template). Founder+ handles the newsletter signup + email delivery;
`funnel-tracker.js` wires the form and captures UTM. No payment, no server.

## Steps (agent: ask the user each)

1. **Asset mana yang dikirim?** — materinya harus jadi asset publik di Founder+.
   - Upload di admin Founder+: **Marketing > Assets** → `visibility=public`,
     `category=lead-magnet` → salin **uuid**-nya.
   - Atau lihat uuid yang sudah ada:
     ```bash
     curl "https://academy.founderplus.id/api/dev/newsletter/available-files?category=lead-magnet"
     ```
2. Edit `index.html`:
   - `data-lead-magnet="<asset-uuid>"` di `<form>`
   - `data-project-id="<project-id>"` di script funnel-tracker (opsional)
   - Ganti judul, copy, dan benefit
   - **Jangan** ubah `name=` field-nya (`name/email/phone/umur/pekerjaan/stage_bisnis`)
     dan jangan hapus honeypot `name="website"`.
3. **Deploy** — gak perlu build:
   ```bash
   fp sites publish index.html        # → host.founderplus.id
   ```
   atau drag ke hosting statik apa pun (funnel-tracker.js cross-origin).

## Cara kerja

funnel-tracker.js mendeteksi submit pada `form[data-lead-magnet]`, validasi
(nama/email/WhatsApp), lalu POST ke endpoint newsletter Founder+
(`/newsletter/subscribe`). Backend mendaftarkan lead + **mengirim asset
(by uuid) ke email mereka**. Form menampilkan "cek email" saat berhasil.

## Catatan

- Field umur/pekerjaan/stage bisnis dikumpulkan untuk kualifikasi lead (CRM).
- Asset di-resolve **by uuid**; pastikan `visibility=public` (kalau tidak, email
  pakai fallback default).
- Ini halaman CAPTURE (pra-akun) — tidak ada login/entitlement. Untuk konten
  terkunci setelah beli, pakai template `fp-fullstack` / `astro` / `nextjs` / `hono`.
