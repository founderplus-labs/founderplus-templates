import { useEffect, useMemo, useState, type ReactElement } from "react";
import { BottomSheet } from "../../lib/BottomSheet.tsx";
import "./posmenu.css";

/* ══════════════════════════ CONFIG ══════════════════════════ */
const CONFIG = {
  storeName: "Warung Kopi Founder+",
  currency: "IDR",
  // Nomor WhatsApp kasir/dapur (format internasional tanpa +, mis. 62812xxxx).
  // Jalur pesanan default yang LANGSUNG BEKERJA tanpa backend.
  whatsapp: "6281234567890",
  // Param URL yang dipakai untuk nomor meja (dukung beberapa alias).
  tableParams: ["meja", "table", "t"],
  // Ikon placeholder per kategori (dipakai kalau item belum punya foto).
  // Nilai = key dari ICONS: "coffee" | "cup" | "food".
  categoryIcon: { Kopi: "coffee", "Non-Kopi": "cup", Makanan: "food" } as Record<string, IconKey>,

  // ─────────────────────────────────────────────────────────────
  // Integrasi Founder+ (SPEC-DRIVEN — lihat SPEC.md).
  // Halaman ini kamu host sendiri. Yang lewat Founder+ (kita):
  //   • TRANSAKSI  → backend POS/checkout Founder+
  //   • GROWTH/GTM → funnel-tracker (analytics, atribusi UTM)
  // Semua deklaratif di sini — tak ada integrasi yang di-hardcode.
  // ─────────────────────────────────────────────────────────────
  founderplus: {
    env: "prod" as "prod" | "dev", // "prod" → api.founderplus.id · "dev" → ops.founderplus.id
    projectId: "", // GTM: id project funnel-tracker (analytics + atribusi). Kosong = tracker off.
    orders: false, // true → kirim pesanan ke backend POS Founder+ (default: WhatsApp)
  },
};

// Resolusi endpoint dari spec di atas — bukan URL yang disebar di kode.
const FP_ENVS = { prod: "https://api.founderplus.id", dev: "https://ops.founderplus.id" };
const FP_API = FP_ENVS[CONFIG.founderplus.env] || FP_ENVS.prod;
// Endpoint transaksi (Founder+). null → jalur WhatsApp.
const POS_ORDERS = CONFIG.founderplus.orders ? `${FP_API}/creator/pos/orders` : null;

// Ikon line monokrom (currentColor) untuk placeholder — bukan emoji.
type IconKey = "coffee" | "cup" | "food" | "photo";
const ICONS: Record<IconKey, ReactElement> = {
  coffee: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v2M14 2v2M6 2v2" />
      <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
    </svg>
  ),
  cup: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h14l-1.3 15.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5 3Z" />
      <path d="M5.6 9h12.8" />
    </svg>
  ),
  food: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  ),
  photo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  ),
};

/* ══════════════════════════ MENU ══════════════════════════ */
// Satu sumber kebenaran menu. price = angka rupiah (tanpa titik/koma).
//   available:false → sold out.   category → grup tampilan.
//   image:"https://…/foto.jpg" (opsional) → foto produk. Kalau kosong,
//   tampil placeholder gradient + ikon (kategori, atau field `icon`).
interface MenuItem {
  id: string;
  name: string;
  desc?: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  icon?: IconKey;
}
const MENU: MenuItem[] = [
  { id: "kopi-susu", name: "Kopi Susu Gula Aren", desc: "Espresso, susu segar, gula aren cair", price: 22000, category: "Kopi", available: true },
  { id: "americano", name: "Americano", desc: "Double shot, air, tanpa gula", price: 18000, category: "Kopi", available: true },
  { id: "latte", name: "Cafe Latte", desc: "Espresso + steamed milk", price: 25000, category: "Kopi", available: true },
  { id: "matcha", name: "Matcha Latte", desc: "Matcha premium, susu", price: 27000, category: "Non-Kopi", available: true },
  { id: "coklat", name: "Coklat Panas", desc: "Dark chocolate, susu", price: 24000, category: "Non-Kopi", available: false },
  { id: "croissant", name: "Butter Croissant", desc: "Panggang, mentega Prancis", price: 20000, category: "Makanan", available: true },
  { id: "nasi-ayam", name: "Nasi Ayam Sambal Matah", desc: "Ayam goreng, sambal matah, nasi hangat", price: 32000, category: "Makanan", available: true },
];
/* ═════════════════════════════════════════════════════════════ */

const fmt = (n: number) =>
  CONFIG.currency === "IDR"
    ? "Rp " + Number(n || 0).toLocaleString("id-ID")
    : Number(n || 0).toLocaleString("en-US", { style: "currency", currency: CONFIG.currency });

function readTable(): string {
  const q = new URLSearchParams(location.search);
  for (const key of CONFIG.tableParams) {
    const raw = q.get(key);
    if (raw) return raw.trim().slice(0, 24).replace(/[^\w\- ]/g, "");
  }
  return "";
}

const itemById = (id: string) => MENU.find((m) => m.id === id);
const iconFor = (it: MenuItem): ReactElement => ICONS[it.icon || CONFIG.categoryIcon[it.category]] || ICONS.food;
const categories = () => [...new Set(MENU.map((m) => m.category))];

interface OrderLine { id: string; name: string; qty: number; price: number; subtotal: number }

export function PosMenu() {
  const TABLE = useMemo(() => readTable(), []);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeCat, setActiveCat] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [note, setNote] = useState("");

  // Header title (matches source: document.title = "Menu — " + storeName).
  useEffect(() => {
    document.title = "Menu — " + CONFIG.storeName;
  }, []);

  // GROWTH/GTM → Founder+ funnel-tracker. Dimuat hanya kalau projectId diisi
  // (spec-driven). env dev diarahkan via data-api-base.
  useEffect(() => {
    const pid = CONFIG.founderplus.projectId;
    if (!pid) return;
    const s = document.createElement("script");
    s.src = "https://cdn.founderplus.id/funnel-tracker.js";
    s.setAttribute("data-project-id", pid);
    if (CONFIG.founderplus.env === "dev") s.setAttribute("data-api-base", FP_ENVS.dev);
    s.defer = true;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, []);

  const { total, count } = useMemo(() => {
    let t = 0, c = 0;
    for (const [id, qty] of Object.entries(cart)) {
      const it = itemById(id);
      if (it) { t += it.price * qty; c += qty; }
    }
    return { total: t, count: c };
  }, [cart]);

  const cats = useMemo(() => categories(), []);

  function setQty(id: string, qty: number) {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  const orderLines = (): OrderLine[] => {
    const lines: OrderLine[] = [];
    for (const [id, qty] of Object.entries(cart)) {
      const it = itemById(id);
      if (it) lines.push({ id, name: it.name, qty, price: it.price, subtotal: it.price * qty });
    }
    return lines;
  };

  function orderSummary() {
    return { table: TABLE || null, items: orderLines(), total };
  }

  function openWhatsApp(order: ReturnType<typeof orderSummary> & { customer: string | null; note: string | null }) {
    const head = `Halo ${CONFIG.storeName}! Pesanan${order.table ? " Meja " + order.table : ""}:`;
    const body = order.items.map((i) => `• ${i.qty}× ${i.name} — ${fmt(i.subtotal)}`).join("\n");
    const foot =
      `\nTotal: ${fmt(order.total)}` +
      (order.customer ? `\nNama: ${order.customer}` : "") +
      (order.note ? `\nCatatan: ${order.note}` : "");
    const text = encodeURIComponent(`${head}\n${body}${foot}`);
    location.href = `https://wa.me/${CONFIG.whatsapp}?text=${text}`;
  }

  function orderDone() {
    setCart({});
    setSheetOpen(false);
  }

  async function submitOrder() {
    const name = custName.trim();
    const noteVal = note.trim();
    const order = { ...orderSummary(), customer: name || null, note: noteVal || null };
    if (order.items.length === 0) return;

    // Transaksi → Founder+ POS backend (spec-driven: founderplus.orders).
    // Fallback ke WhatsApp pada kegagalan apa pun agar pesanan meja tak
    // pernah hilang diam-diam.
    if (POS_ORDERS) {
      try {
        const res = await fetch(POS_ORDERS, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });
        if (res.ok) { orderDone(); return; }
      } catch (_) { /* fall through to WhatsApp */ }
    }
    openWhatsApp(order);
    orderDone();
  }

  const scrollToCat = (i: number) => {
    setActiveCat(i);
    document.getElementById("cat-" + i)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sheetTable = TABLE ? "Meja " + TABLE : "Tanpa meja";
  const lines = orderLines();

  // Build the menu with a running index so the entrance stagger matches source.
  let idx = 0;

  return (
    <div data-tpl="pos-menu">
      <header>
        <div className="store">{CONFIG.storeName}</div>
        {TABLE && (
          <span className="table-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>{" "}
            Meja <span>{TABLE}</span>
          </span>
        )}
      </header>

      <main>
        {!TABLE && (
          <div className="banner-warn">
            Nomor meja tidak terbaca dari QR. Kamu masih bisa memesan — sebutkan nomor mejamu ke kasir, atau scan ulang QR di meja.
          </div>
        )}
        <nav className="cats" aria-label="Kategori">
          {cats.map((cat, i) => (
            <button
              key={cat}
              type="button"
              aria-current={i === activeCat ? "true" : undefined}
              onClick={() => scrollToCat(i)}
            >
              {cat}
            </button>
          ))}
        </nav>
        <div>
          {cats.map((cat, i) => (
            <div key={cat}>
              <h2 className="cat" id={"cat-" + i}>{cat}</h2>
              {MENU.filter((m) => m.category === cat).map((it) => {
                const delay = Math.min(idx * 45, 360);
                idx += 1;
                const qty = cart[it.id] || 0;
                return (
                  <article
                    key={it.id}
                    className={"item" + (it.available ? "" : " out")}
                    style={{ animationDelay: delay + "ms" }}
                  >
                    <div className="body">
                      <div className="name">{it.name}</div>
                      {it.desc && <div className="desc">{it.desc}</div>}
                      <div className="price">{fmt(it.price)}</div>
                    </div>
                    <div className="media">
                      {it.image ? (
                        <img className="thumb" src={it.image} alt="" loading="lazy" />
                      ) : (
                        <div className="thumb-ph" aria-hidden="true">{iconFor(it)}</div>
                      )}
                      <div className="control">
                        {!it.available ? (
                          <div className="badge-out">Habis</div>
                        ) : qty <= 0 ? (
                          <button className="add" type="button" onClick={() => setQty(it.id, 1)}>+ Tambah</button>
                        ) : (
                          <div className="stepper">
                            <button className="step" type="button" aria-label="Kurangi" onClick={() => setQty(it.id, qty - 1)}>−</button>
                            <span className="qty">{qty}</span>
                            <button className="step" type="button" aria-label="Tambah" onClick={() => setQty(it.id, qty + 1)}>+</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
        <footer>
          Ditenagai <a href="https://founderplus.id" target="_blank" rel="noopener">Founder+</a> · Pesanan aman
        </footer>
      </main>

      <div className={"cartbar" + (count > 0 ? " show" : "")}>
        <button type="button" className="go" onClick={() => setSheetOpen(true)}>
          <span className="left">Lihat pesanan <span className="count">{count}</span></span>
          <span className="total">{fmt(total)}</span>
        </button>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        label="Pesanan"
        className="bg-[var(--card)] text-[var(--ink)]"
      >
        <div className="grabber" aria-hidden="true" />
        <button className="close" aria-label="Tutup" onClick={() => setSheetOpen(false)}>✕</button>
        <div className="sheet-in">
          <h3>Pesanan · <span>{sheetTable}</span></h3>
          <div>
            {lines.length === 0 ? (
              <div className="empty">Belum ada pesanan.</div>
            ) : (
              lines.map((l) => {
                const it = itemById(l.id)!;
                return (
                  <div className="cline" key={l.id}>
                    {it.image ? (
                      <img className="cthumb" src={it.image} alt="" />
                    ) : (
                      <div className="cthumb-ph" aria-hidden="true">{iconFor(it)}</div>
                    )}
                    <div className="cinfo">
                      <div className="cname">{it.name}</div>
                      <div className="cprice">{fmt(it.price)} · {fmt(it.price * l.qty)}</div>
                    </div>
                    <div className="cstep">
                      <button type="button" aria-label="Kurangi" onClick={() => setQty(l.id, l.qty - 1)}>−</button>
                      <span className="cq">{l.qty}</span>
                      <button type="button" aria-label="Tambah" onClick={() => setQty(l.id, l.qty + 1)}>+</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="total-row"><span>Total</span><span>{fmt(total)}</span></div>
          <input
            type="text"
            inputMode="text"
            placeholder="Nama (opsional)"
            autoComplete="name"
            value={custName}
            onChange={(e) => setCustName(e.target.value)}
          />
          <textarea
            rows={2}
            placeholder="Catatan buat dapur (opsional) — mis. es sedikit, pedas"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button className="send" disabled={lines.length === 0} onClick={submitOrder}>Kirim pesanan</button>
        </div>
      </BottomSheet>
    </div>
  );
}
