# Prompt — Event / Webinar Registration

Paste into Google AI Studio (Build). Fill `[…]` first.

---

Build a single-file `index.html` registration page for an event/webinar.
Self-contained (inline CSS), mobile-first, clean.

EVENT
- Title: [JUDUL EVENT]
- Date/time: [TANGGAL & JAM, WIB]
- Format: [online/offline, lokasi/link]
- For whom + what they get: [TARGET + TAKEAWAY]
- Ticket price: [HARGA, atau "Gratis"]
- Agenda — 3–6 points: [LIST]

PAGE STRUCTURE
1. Hero: event title + date/time + register button.
2. What you'll get — bullets.
3. Agenda/rundown.
4. Speaker(s) — short bio placeholder.
5. Final CTA with register button + "Pembayaran & tiket lewat Founder+".

FOUNDER+ CHECKOUT — INCLUDE EXACTLY (product-type = event):

```html
<button type="button" data-product-slug="[SLUG-EVENT]" data-product-type="event">
  Daftar event
</button>
```

LAST before `</body>`:

```html
<script src="https://cdn.founderplus.id/funnel-tracker.js" data-project-id="[PROJECT-ID]" defer></script>
```

RULES
- Output ONE `index.html`. Indonesian copy.
- Show date/time prominently. No fake "seats left" counters.
- Keep `data-product-slug` + `data-product-type="event"` exactly. No other payment code.
