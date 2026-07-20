# Founder+ React Templates

React 19 + Vite 7 + Tailwind CSS v4 ports of the no-build HTML templates in this
repo. Same designs, same behaviour — now as real components you can drop into an
app, extend with hooks, and typecheck.

> The originals (single self-contained `.html` files) still live in their own
> folders and remain the zero-build option. This project is for teams who want the
> templates inside a React toolchain.

## Stack

- **React 19** — hooks, `StrictMode`.
- **Vite 7** — dev server + build.
- **Tailwind CSS v4** — CSS-first config (`@import "tailwindcss"` + `@theme` in
  `src/index.css`). Brand gradient, accent tokens, Apple-ish easings, and reduced
  motion are defined once as theme tokens.
- **TypeScript** (strict).

No third-party runtime assets: icons are inline SVG, "imagery" is CSS, and the
only optional network call is the Founder+ funnel-tracker (injected solely when a
`projectId` is set). `qrcode-generator` is the single UI dependency, used by the
table-QR print tool.

## Run

```bash
bun install      # or npm install
bun run dev      # Vite dev server — a gallery to switch between templates
bun run build    # tsc -b && vite build → dist/
bun run preview  # serve the production build
```

`src/App.tsx` is a **showcase shell** — a sidebar that mounts one template at a
time. In a real deployment you'd render a single template component as your app
root instead.

## Templates

| Component | Source | What it is |
|-----------|--------|------------|
| `PremiumLanding` | `premium-landing/` | Dark premium landing — hero, features, count-up stats, pricing, CTA. Scroll-reveal + count-up via hooks. |
| `LinkInBio` | `link-in-bio/` | Creator microsite — avatar, socials, link buttons, Founder+ checkout links. |
| `Katalog` | `katalog/` | Online shop — category filter, cart bar + sheet, WhatsApp order. Light + dark. |
| `Booking` | `booking/` | Service appointments — service → date → generated slots → WhatsApp confirm. Light + dark. |
| `Invoice` | `invoice/` | Invoice / kwitansi generator — live document preview, Cetak/PDF, save/load drafts. |
| `PosMenu` | `pos-qr-menu/index.html` | Customer per-table QR menu → order. |
| `PosKasir` | `pos-qr-menu/kasir.html` | Cashier — dynamic QRIS / transfer / cash + proof, ESC/POS Bluetooth receipt, history + daily report. |
| `PosMeja` | `pos-qr-menu/meja.html` | Table status board + reservations. |
| `PosServis` | `pos-qr-menu/servis.html` | Service tickets. |
| `PosTables` | `pos-qr-menu/tables.html` | Per-table QR print tool. |

## Structure

```
src/
  App.tsx            # showcase shell (template switcher)
  index.css          # Tailwind v4 @import + @theme design tokens
  lib/
    format.ts        # currency / initials / wa.me helpers
    founderplus.ts   # checkout URL + spec-driven funnel-tracker hook
    icons.tsx        # inline monochrome icon set
    reveal.tsx       # scroll-reveal component + hook
    BottomSheet.tsx  # native <dialog> bottom sheet (+ sheet.css)
  templates/
    *.tsx            # one component per template (+ scoped *.css for light/dark)
    pos/             # the POS suite
```

### Design tokens

Global brand tokens live in `src/index.css` under `@theme`. Templates that are
light-first with a dark fast-follow (katalog, booking, the POS suite) keep their
exact palette in a scoped `[data-tpl="…"]` block in a co-located `*.css`, switched
by `@media (prefers-color-scheme: dark)` — matching the source HTML one-to-one.
