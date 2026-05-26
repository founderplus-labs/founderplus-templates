# Prompt — Ebook / Digital Product Landing

Paste this into Google AI Studio (Build). Replace the `[…]` placeholders first.

---

Build a single-file `index.html` landing page that sells an ebook. Self-contained
(inline CSS, no external CSS frameworks, no build step). Mobile-first, fast, clean
— no AI-slop gradients, no stock-photo clutter, generous whitespace.

PRODUCT
- Title: [JUDUL EBOOK]
- Who it's for: [TARGET PEMBACA]
- The transformation/outcome: [HASIL YANG DIDAPAT]
- Price: [HARGA, mis. Rp 49.000]
- 4–6 concrete chapters/benefits: [LIST]

PAGE STRUCTURE
1. Hero: headline (the outcome, not the format) + 1-line subhead + the buy button.
2. "What you'll learn" — the chapters/benefits as a tight list.
3. "Who this is for" — 2–3 lines.
4. Author/credibility — 1 short paragraph (leave a placeholder).
5. Final CTA with the buy button again + reassurance ("Bayar aman lewat Founder+, akses instan").

FOUNDER+ CHECKOUT — INCLUDE THIS EXACTLY, do not rewrite the data-* attributes or
the script. Style the button however fits the design, but keep the attributes:

```html
<button type="button" data-product-slug="[SLUG-PRODUK]" data-product-type="customProduct">
  Beli sekarang
</button>
```

And as the LAST element before `</body>`:

```html
<script src="https://cdn.founderplus.id/funnel-tracker.js" data-project-id="[PROJECT-ID]" defer></script>
```

RULES
- Output ONE complete `index.html` only.
- Indonesian copy, persuasive but honest — no fake testimonials, no countdown timers.
- The buy button must carry `data-product-slug` + `data-product-type` exactly.
- Don't add any other payment/checkout code — Founder+ handles payment.
