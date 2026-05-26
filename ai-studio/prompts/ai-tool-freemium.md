# Prompt — Free AI Tool that Sells (Gemini-powered)

The AI Studio sweet spot: a small Gemini-powered tool that's free to try, then
upsells a Founder+ product for the full version. Paste into AI Studio (Build).

---

Build a single-page app: a small, genuinely useful AI tool powered by Gemini,
with a free tier that nudges users to buy the full Founder+ product.

THE TOOL
- What it does: [mis. "generate 5 hook caption dari 1 topik"]
- Free tier limit: [mis. "3 generate gratis, lalu unlock unlimited"]
- The paid product it upsells: [JUDUL PRODUK]
- Price: [HARGA]

BEHAVIOR
1. User enters input → tool calls Gemini (use `@google/genai`, model
   `gemini-2.5-flash`) → shows result.
2. Track free uses in `localStorage`. After the free limit, replace the result
   area with an upsell card + the Founder+ buy button.
3. Keep it tasteful: clean single column, no slop.

GEMINI
- Use `import { GoogleGenAI } from '@google/genai'`.
- Read the key from the AI Studio env (`process.env.API_KEY`).
- SECURITY NOTE for the user (put as an HTML comment): a client-side Gemini key
  is abusable — for production, restrict the key by referrer/quota or proxy via a
  Cloudflare Worker. Don't ship an unrestricted billing key.

FOUNDER+ CHECKOUT — INCLUDE EXACTLY in the upsell card:

```html
<button type="button" data-product-slug="[SLUG-PRODUK]" data-product-type="customProduct">
  Unlock versi penuh
</button>
```

LAST before `</body>`:

```html
<script src="https://cdn.founderplus.id/funnel-tracker.js" data-project-id="[PROJECT-ID]" defer></script>
```

RULES
- Indonesian UI copy.
- Free tool must actually work and be useful on its own (no bait-and-switch).
- Upsell only appears after the free limit; never block the first uses.
- Keep the buy button's `data-*` attributes exactly. No other payment code.
