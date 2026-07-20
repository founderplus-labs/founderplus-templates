import { useEffect, useMemo, useState } from "react";
import { useFounderplusTracker } from "../lib/founderplus.ts";
import { BottomSheet } from "../lib/BottomSheet.tsx";
import { IconCart } from "../lib/icons.tsx";
import "./katalog.css";

/* ══════════════════════════ SHOP ══════════════════════════ */
const SHOP = {
  name: "Toko Kamu",
  whatsapp: "6281234567890", // WA penjual, format 62… tanpa +
  currency: "IDR",
  founderplus: { projectId: "" }, // GTM opsional (spec-driven)
};

/* ══════════════════════════ PRODUCTS ══════════════════════════ */
interface Product {
  id: string;
  name: string;
  desc?: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
}
const PRODUCTS: Product[] = [
  { id: "kaos-hitam", name: "Kaos Polos Hitam", desc: "Cotton combed 30s, unisex", price: 89000, category: "Pakaian", available: true },
  { id: "kaos-putih", name: "Kaos Polos Putih", desc: "Cotton combed 30s, unisex", price: 89000, category: "Pakaian", available: true },
  { id: "totebag", name: "Tote Bag Kanvas", desc: "Kanvas tebal, sablon custom", price: 65000, category: "Aksesoris", available: true },
  { id: "topi", name: "Topi Baseball", desc: "Adjustable, bordir logo", price: 75000, category: "Aksesoris", available: false },
  { id: "mug", name: "Mug Keramik", desc: "330ml, print full color", price: 55000, category: "Aksesoris", available: true },
  { id: "hoodie", name: "Hoodie Fleece", desc: "Cotton fleece, hangat", price: 189000, category: "Pakaian", available: true },
];
/* ═════════════════════════════════════════════════════════════ */

const fmt = (n: number) =>
  SHOP.currency === "IDR"
    ? "Rp " + Number(n || 0).toLocaleString("id-ID")
    : Number(n || 0).toLocaleString("en-US", { style: "currency", currency: SHOP.currency });

function BoxIcon({ className = "size-[34px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

function Placeholder({ p, className, iconClass }: { p: Product; className: string; iconClass: string }) {
  return (
    <div className={className}>
      {p.image ? (
        <img src={p.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <BoxIcon className={iconClass} />
      )}
    </div>
  );
}

export function Katalog() {
  const [filter, setFilter] = useState("Semua");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddr, setBuyerAddr] = useState("");

  useFounderplusTracker(SHOP.founderplus.projectId);
  useEffect(() => {
    document.title = `${SHOP.name} — Katalog`;
  }, []);

  const categories = useMemo(() => ["Semua", ...new Set(PRODUCTS.map((p) => p.category))], []);
  const list = PRODUCTS.filter((p) => filter === "Semua" || p.category === filter);
  const byId = (id: string) => PRODUCTS.find((p) => p.id === id);

  const { total, count } = useMemo(() => {
    let t = 0, c = 0;
    for (const [id, q] of Object.entries(cart)) {
      const p = byId(id);
      if (p) { t += p.price * q; c += q; }
    }
    return { total: t, count: c };
  }, [cart]);

  const setQty = (id: string, q: number) =>
    setCart((prev) => {
      const next = { ...prev };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });

  const order = () => {
    const entries = Object.entries(cart);
    if (entries.length === 0) return;
    const lines = entries
      .map(([id, q]) => {
        const p = byId(id);
        return p ? `• ${q}× ${p.name} — ${fmt(p.price * q)}` : "";
      })
      .filter(Boolean);
    const text =
      `Halo ${SHOP.name}! Mau pesan:\n${lines.join("\n")}\nTotal: ${fmt(total)}` +
      (buyerName.trim() ? `\nNama: ${buyerName.trim()}` : "") +
      (buyerAddr.trim() ? `\nAlamat/catatan: ${buyerAddr.trim()}` : "");
    location.href = `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  const cartEntries = Object.entries(cart);

  return (
    <div data-tpl="katalog" className="min-h-dvh bg-[var(--k-bg)] pb-24 text-[var(--k-ink)] antialiased">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--k-line)] bg-[color-mix(in_srgb,var(--k-bg)_82%,transparent)] pt-3.5 pb-3 backdrop-blur-[16px] backdrop-saturate-150">
        <div className="mx-auto flex max-w-[720px] items-center gap-3 px-4">
          <div className="min-w-0 flex-1 truncate text-lg font-bold tracking-[-0.02em]">{SHOP.name}</div>
          <button
            type="button"
            aria-label="Keranjang"
            onClick={() => setOpen(true)}
            className="relative grid size-10 place-items-center rounded-full bg-[var(--k-card)] text-[var(--k-ink)] shadow-[inset_0_0_0_1px_var(--k-line)] transition-transform duration-150 ease-out-quint active:scale-90"
          >
            <IconCart className="size-[19px]" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--k-accent)] px-[5px] text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4">
        {/* Categories */}
        <nav className="flex gap-2 overflow-x-auto pt-3.5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => {
            const active = c === filter;
            return (
              <button
                key={c}
                type="button"
                aria-current={active}
                onClick={() => setFilter(c)}
                className={[
                  "flex-none rounded-full px-[15px] py-2 text-[13.5px] font-semibold whitespace-nowrap transition-all duration-150 ease-out-quint",
                  active
                    ? "bg-[var(--k-ink)] text-[var(--k-bg)] shadow-[inset_0_0_0_1px_var(--k-ink)]"
                    : "bg-[var(--k-card)] text-[var(--k-secondary)] shadow-[inset_0_0_0_1px_var(--k-line)]",
                ].join(" ")}
              >
                {c}
              </button>
            );
          })}
        </nav>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-4 pb-2 sm:grid-cols-3">
          {list.map((p) => {
            const q = cart[p.id] || 0;
            return (
              <div
                key={p.id}
                className={[
                  "flex flex-col overflow-hidden rounded-2xl bg-[var(--k-card)] shadow-[inset_0_0_0_1px_var(--k-line)]",
                  p.available ? "" : "[&_.ph]:opacity-70 [&_.ph]:grayscale-[0.6]",
                ].join(" ")}
              >
                <Placeholder
                  p={p}
                  className="ph relative grid aspect-square place-items-center bg-[color-mix(in_srgb,var(--k-ink)_5%,var(--k-card))] text-[color-mix(in_srgb,var(--k-ink)_26%,transparent)]"
                  iconClass="size-[34px]"
                />
                <div className="flex flex-1 flex-col gap-[3px] px-[13px] pt-3 pb-[13px]">
                  <div className="text-[14.5px] font-semibold tracking-[-0.01em]">{p.name}</div>
                  {p.desc && <div className="line-clamp-2 text-xs text-[var(--k-muted)]">{p.desc}</div>}
                  <div className="mt-auto pt-1.5 text-[14.5px] font-bold tracking-[-0.01em]">{fmt(p.price)}</div>
                </div>
                <div className="px-[13px] pb-[13px]">
                  {!p.available ? (
                    <div className="p-2.5 text-center text-xs font-semibold text-[var(--k-muted)]">Habis</div>
                  ) : q <= 0 ? (
                    <button
                      type="button"
                      onClick={() => setQty(p.id, 1)}
                      className="w-full rounded-[11px] bg-[color-mix(in_srgb,var(--k-accent)_12%,transparent)] p-2.5 text-[13.5px] font-bold text-[var(--k-accent-ink)] transition-[transform,background] duration-150 ease-out-quint hover:bg-[color-mix(in_srgb,var(--k-accent)_18%,transparent)] active:scale-[0.96]"
                    >
                      + Keranjang
                    </button>
                  ) : (
                    <div className="flex items-center justify-between gap-0.5 rounded-[11px] bg-[color-mix(in_srgb,var(--k-accent)_10%,transparent)] p-1">
                      <button type="button" onClick={() => setQty(p.id, q - 1)} className="h-[30px] w-[34px] rounded-lg text-lg text-[var(--k-accent-ink)] active:scale-90">
                        −
                      </button>
                      <span className="font-bold tabular-nums">{q}</span>
                      <button type="button" onClick={() => setQty(p.id, q + 1)} className="h-[30px] w-[34px] rounded-lg text-lg text-[var(--k-accent-ink)] active:scale-90">
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="py-[22px] text-center text-[12.5px] text-[var(--k-muted)]">
          Ditenagai{" "}
          <a href="https://founderplus.id" target="_blank" rel="noopener" className="text-[var(--k-accent-ink)] no-underline">
            Founder+
          </a>
        </footer>
      </main>

      {/* Cart bar */}
      <div
        className={[
          "fixed inset-x-0 bottom-0 z-25 border-t border-[var(--k-line)] bg-[color-mix(in_srgb,var(--k-bg)_84%,transparent)] px-4 py-3 backdrop-blur-[16px] backdrop-saturate-150 transition-transform duration-[400ms] ease-drawer",
          count > 0 ? "translate-y-0" : "translate-y-[140%]",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-3 rounded-2xl bg-[var(--k-ink)] px-[18px] py-[15px] text-base font-semibold text-[var(--k-bg)]"
        >
          <span>
            Lihat keranjang{" "}
            <span className="ml-2 rounded-full bg-[color-mix(in_srgb,var(--k-bg)_22%,transparent)] px-2 py-px text-[13px]">{count}</span>
          </span>
          <span className="font-extrabold tracking-[-0.01em] tabular-nums">{fmt(total)}</span>
        </button>
      </div>

      {/* Cart sheet */}
      <BottomSheet open={open} onClose={() => setOpen(false)} label="Keranjang" className="bg-[var(--k-card)] text-[var(--k-ink)]">
        <div className="mx-auto mt-2.5 h-[5px] w-[38px] rounded-[3px] bg-[var(--k-line)]" />
        <button
          type="button"
          aria-label="Tutup"
          onClick={() => setOpen(false)}
          className="absolute top-3.5 right-4 grid size-[30px] place-items-center rounded-full bg-[var(--k-bg)] text-base text-[var(--k-muted)]"
        >
          ✕
        </button>
        <div className="overflow-y-auto px-[18px] pt-3 pb-5">
          <h3 className="my-1.5 mb-3 text-lg tracking-[-0.015em]">Keranjang</h3>
          <div>
            {cartEntries.length === 0 ? (
              <div className="px-5 py-10 text-center text-[var(--k-muted)]">Keranjang kosong.</div>
            ) : (
              cartEntries.map(([id, q]) => {
                const p = byId(id);
                if (!p) return null;
                return (
                  <div key={id} className="flex items-center gap-3 border-b border-[var(--k-line)] py-[11px] last:border-b-0">
                    <Placeholder
                      p={p}
                      className="relative grid size-[46px] flex-none place-items-center overflow-hidden rounded-[11px] bg-[color-mix(in_srgb,var(--k-ink)_5%,var(--k-card))] text-[color-mix(in_srgb,var(--k-ink)_28%,transparent)]"
                      iconClass="size-5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-semibold">{p.name}</div>
                      <div className="mt-0.5 text-[12.5px] text-[var(--k-muted)] tabular-nums">
                        {fmt(p.price)} · {fmt(p.price * q)}
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-0.5 rounded-full bg-[var(--k-bg)] px-[3px] shadow-[inset_0_0_0_1px_var(--k-line)]">
                      <button type="button" onClick={() => setQty(id, q - 1)} className="size-7 rounded-full text-[17px] text-[var(--k-accent-ink)]">
                        −
                      </button>
                      <span className="min-w-[18px] text-center text-sm font-bold tabular-nums">{q}</span>
                      <button type="button" onClick={() => setQty(id, q + 1)} className="size-7 rounded-full text-[17px] text-[var(--k-accent-ink)]">
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="my-4 mb-1 flex items-baseline justify-between text-[19px] font-extrabold tracking-[-0.02em]">
            <span>Total</span>
            <span className="tabular-nums">{fmt(total)}</span>
          </div>
          <input
            value={buyerName}
            onChange={(e) => setBuyerName(e.target.value)}
            type="text"
            placeholder="Nama (opsional)"
            autoComplete="name"
            className="mt-2.5 w-full rounded-xl bg-[var(--k-bg)] px-[13px] py-3 text-[var(--k-ink)] shadow-[inset_0_0_0_1px_var(--k-line)] outline-none focus:shadow-[inset_0_0_0_2px_var(--k-accent)]"
          />
          <input
            value={buyerAddr}
            onChange={(e) => setBuyerAddr(e.target.value)}
            type="text"
            placeholder="Alamat / catatan (opsional)"
            className="mt-2.5 w-full rounded-xl bg-[var(--k-bg)] px-[13px] py-3 text-[var(--k-ink)] shadow-[inset_0_0_0_1px_var(--k-line)] outline-none focus:shadow-[inset_0_0_0_2px_var(--k-accent)]"
          />
          <button
            type="button"
            onClick={order}
            disabled={cartEntries.length === 0}
            className="mt-3.5 w-full rounded-2xl bg-[var(--k-ok)] p-[15px] text-base font-bold text-white transition-transform active:scale-[0.985] disabled:opacity-45"
          >
            Pesan via WhatsApp
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
