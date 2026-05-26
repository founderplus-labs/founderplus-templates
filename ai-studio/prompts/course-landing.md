# Prompt — Online Course Landing

Paste into Google AI Studio (Build). Fill the `[…]` placeholders first.

---

Build a single-file `index.html` sales page for an online course. Self-contained
(inline CSS), mobile-first, clean, no AI-slop. Fast and scannable.

COURSE
- Title: [JUDUL KURSUS]
- For whom: [TARGET PESERTA]
- Outcome after finishing: [HASIL KONKRET]
- Format: [mis. 12 video, 3 jam, + workbook]
- Price: [HARGA]
- Curriculum — 5–10 modules: [LIST MODUL]

PAGE STRUCTURE
1. Hero: outcome headline + subhead + enroll button.
2. "What you'll be able to do" — outcomes as bullets.
3. Curriculum — modules as a numbered list with 1-line each.
4. Format & what's included (videos, files, akses selamanya, dll).
5. Instructor — short bio placeholder.
6. FAQ — 3–4 Q&A.
7. Final CTA with enroll button + "Bayar aman lewat Founder+, akses instan".

FOUNDER+ CHECKOUT — INCLUDE EXACTLY (note product-type = course):

```html
<button type="button" data-product-slug="[SLUG-KURSUS]" data-product-type="course">
  Daftar sekarang
</button>
```

LAST before `</body>`:

```html
<script src="https://cdn.founderplus.id/funnel-tracker.js" data-project-id="[PROJECT-ID]" defer></script>
```

RULES
- Output ONE complete `index.html`.
- Indonesian, persuasive but honest. No fake numbers, no fake urgency.
- Keep `data-product-slug` + `data-product-type="course"` exactly.
- No other payment code.
