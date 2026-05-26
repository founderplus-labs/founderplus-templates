# AI Studio — Prompt Pack

Build a selling page with **Google AI Studio** that's pre-wired to the Founder+
CDN checkout — no framework, no build, no payment code. You paste a
product-specific prompt, Gemini generates a static `index.html`, you fill in your
product slug, and publish.

## Why static + CDN
AI Studio apps run in the browser. Founder+ **checkout is client-side** —
`funnel-tracker.js` from `cdn.founderplus.id` turns any `[data-product-slug]`
button into a real checkout. So a static page is all you need to sell. (Gated
*content* needs a server — use the `astro` / `nextjs` / `hono` / `fp-fullstack`
templates for that.)

## Prompts (`prompts/`)

| Prompt | For | product-type |
|--------|-----|--------------|
| `ebook-landing.md` | Ebook / digital file | `customProduct` |
| `course-landing.md` | Online course | `course` |
| `event-registration.md` | Event / webinar | `event` |
| `ai-tool-freemium.md` | Free Gemini tool that upsells | `customProduct` |

`_snippet.html` = the exact Founder+ checkout snippet every prompt tells the AI
to keep verbatim.

## How to use

1. Create the product first → get its slug:
   ```bash
   fp products create --title "..." --price ... --status published \
     --delivery "type=link,label=Akses,url=https://..."
   fp products list      # copy the slug
   ```
2. Open the prompt for your product type, replace the `[…]` placeholders
   (title, price, slug, project id).
3. Paste into **Google AI Studio → Build**. Let Gemini generate the page.
4. Confirm the buy button still has `data-product-slug` + `data-product-type`,
   and the `funnel-tracker.js` script is the last thing before `</body>`.
5. Export → publish:
   ```bash
   fp sites publish index.html      # → host.founderplus.id
   ```

See `SETUP.md` for the step-by-step + the security note on Gemini API keys.
