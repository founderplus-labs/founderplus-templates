import { useState, type ComponentType } from "react";
import { LinkInBio } from "./templates/LinkInBio.tsx";
import { PremiumLanding } from "./templates/PremiumLanding.tsx";
import { Katalog } from "./templates/Katalog.tsx";
import { Booking } from "./templates/Booking.tsx";
import { Invoice } from "./templates/Invoice.tsx";
import { PosMenu } from "./templates/pos/PosMenu.tsx";
import { PosKasir } from "./templates/pos/PosKasir.tsx";
import { PosMeja } from "./templates/pos/PosMeja.tsx";
import { PosServis } from "./templates/pos/PosServis.tsx";
import { PosTables } from "./templates/pos/PosTables.tsx";

/**
 * Showcase shell. Each template is a self-contained component that owns its own
 * config, styling and behaviour — the shell only picks which one to mount.
 * A real deployment would render a single template as its own app root.
 */
interface Entry {
  id: string;
  name: string;
  blurb: string;
  Component: ComponentType;
}

const TEMPLATES: Entry[] = [
  {
    id: "premium-landing",
    name: "Premium landing",
    blurb: "Landing gelap premium — hero, fitur, angka count-up, harga, CTA.",
    Component: PremiumLanding,
  },
  {
    id: "link-in-bio",
    name: "Link in bio",
    blurb: "Microsite kreator — avatar, sosial, tombol tautan & checkout Founder+.",
    Component: LinkInBio,
  },
  {
    id: "katalog",
    name: "Katalog",
    blurb: "Toko online — filter kategori, keranjang, order via WhatsApp. Light + dark.",
    Component: Katalog,
  },
  {
    id: "booking",
    name: "Booking",
    blurb: "Janji temu jasa — pilih layanan, tanggal, slot jam, konfirmasi WhatsApp.",
    Component: Booking,
  },
  {
    id: "invoice",
    name: "Invoice / Kwitansi",
    blurb: "Generator dokumen — form → pratinjau live → Cetak/PDF, simpan draft.",
    Component: Invoice,
  },
  {
    id: "pos-menu",
    name: "POS · Menu QR",
    blurb: "Menu per-meja untuk pelanggan — scan, pilih, kirim pesanan.",
    Component: PosMenu,
  },
  {
    id: "pos-kasir",
    name: "POS · Kasir",
    blurb: "Kasir — QRIS dinamis / transfer / tunai, struk ESC/POS, riwayat + rekap.",
    Component: PosKasir,
  },
  {
    id: "pos-meja",
    name: "POS · Meja",
    blurb: "Status meja + reservasi.",
    Component: PosMeja,
  },
  {
    id: "pos-servis",
    name: "POS · Servis",
    blurb: "Tiket service management dengan alur status.",
    Component: PosServis,
  },
  {
    id: "pos-tables",
    name: "POS · Cetak QR",
    blurb: "Alat cetak QR per-meja (offline).",
    Component: PosTables,
  },
];

export function App() {
  const [activeId, setActiveId] = useState(TEMPLATES[0].id);
  const active = TEMPLATES.find((t) => t.id === activeId) ?? TEMPLATES[0];
  const Active = active.Component;

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50 text-neutral-900 md:flex-row dark:bg-neutral-950 dark:text-neutral-100">
      <aside className="shrink-0 border-b border-neutral-200 bg-white/70 p-4 backdrop-blur md:w-72 md:border-r md:border-b-0 print:hidden dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="mb-4 flex items-center gap-2">
          <span className="size-6 rounded-md bg-gradient-to-br from-brand-1 via-brand-4 to-brand-6" />
          <span className="text-sm font-semibold tracking-tight">Founder+ Templates</span>
        </div>
        <nav className="flex flex-col gap-1">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className={[
                "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                t.id === activeId
                  ? "bg-accent/10 font-semibold text-accent-ink dark:text-accent-soft"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800",
              ].join(" ")}
            >
              {t.name}
              <span className="mt-0.5 block text-xs font-normal text-neutral-400">{t.blurb}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <Active />
      </main>
    </div>
  );
}
