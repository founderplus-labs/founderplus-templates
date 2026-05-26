# Setup — AI Studio Prompt Pack

> Agent: walk the user through this. No build/server — output is a static page
> wired to the Founder+ CDN checkout.

## Steps

1. **Produk apa yang dijual?** Tentukan tipe → pilih prompt:
   - ebook/file → `prompts/ebook-landing.md`
   - kursus → `prompts/course-landing.md`
   - event/webinar → `prompts/event-registration.md`
   - tool AI gratis yang nge-upsell → `prompts/ai-tool-freemium.md`

2. **Buat produk + ambil slug:**
   ```bash
   fp products create --title "<judul>" --price <harga> --status published \
     --delivery "type=link,label=Akses,url=https://<domain>/"
   fp products list      # salin slug
   ```

3. **Isi placeholder** di prompt: `[JUDUL]`, `[HARGA]`, `[SLUG-PRODUK]`,
   `[PROJECT-ID]`, dll.

4. **Paste ke Google AI Studio** (Build) → generate.

5. **Cek hasil** sebelum publish:
   - tombol beli punya `data-product-slug="<slug>"` + `data-product-type="<tipe>"`
   - `<script src="https://cdn.founderplus.id/funnel-tracker.js" ...>` ADA, di
     paling akhir sebelum `</body>`
   - gak ada kode pembayaran lain (Stripe/dll) — FP yang handle

6. **Publish:**
   ```bash
   fp sites publish index.html      # → host.founderplus.id
   ```
   atau hosting statik apa pun.

## Tipe produk (data-product-type)
`customProduct` (produk custom: ebook/template/tool) · `course` · `event` ·
`subscriptionPackage` · `mentoring`.

## Keamanan
- **Static landing** (ebook/course/event): tidak ada secret, tidak ada gating —
  aman. Pembayaran di sisi Founder+.
- **Gemini tool** (`ai-tool-freemium`): API key Gemini ada di browser → bisa
  diabuse. Untuk produksi: batasi key (referrer/quota) atau proxy via Cloudflare
  Worker. Jangan pakai billing key tanpa batas.
- **Gating konten berbayar**: jangan andalkan cek di client. Kalau butuh konten
  yang benar-benar terkunci setelah beli, pakai template SSR (`astro`/`nextjs`/
  `hono`/`fp-fullstack`).
