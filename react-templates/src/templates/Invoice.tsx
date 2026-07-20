import { useEffect, useMemo, useRef, useState } from "react";
import "./invoice.css";

const LS = "fp_invoice_v1";

type Kind = "INVOICE" | "KWITANSI";
interface Item {
  id: string;
  desc: string;
  qty: number;
  price: number;
}

let seq = 0;
const nextId = () => `it${++seq}`;

function autoNo(): string {
  const d = new Date();
  return `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-001`;
}
const digits = (s: string) => Number(String(s).replace(/[^\d.]/g, "")) || 0;

interface Draft {
  kind: Kind;
  biz: { name: string; addr: string };
  cli: { name: string; addr: string };
  no: string;
  date: string;
  tax: string;
  cur: string;
  notes: string;
  sign: string;
  items: { desc: string; qty: number; price: number }[];
}

const sec = "mt-[18px] mb-2.5 text-[11px] font-bold tracking-[0.06em] text-[var(--i-muted)] uppercase first:mt-1";
const label = "mb-[5px] block text-xs font-semibold text-[var(--i-secondary)]";
const input =
  "w-full rounded-[10px] bg-[var(--i-bg)] px-[11px] py-2.5 text-[var(--i-ink)] shadow-[inset_0_0_0_1px_var(--i-line)] outline-none focus:shadow-[inset_0_0_0_2px_var(--i-accent)]";

export function Invoice() {
  const [kind, setKind] = useState<Kind>("INVOICE");
  const [bizName, setBizName] = useState("Usaha Kamu");
  const [bizAddr, setBizAddr] = useState("Jl. Contoh No. 10, Kota\n0812-3456-7890");
  const [cliName, setCliName] = useState("Nama Pelanggan");
  const [cliAddr, setCliAddr] = useState("");
  const [invNo, setInvNo] = useState(autoNo);
  const [invDate, setInvDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [tax, setTax] = useState("0");
  const [cur, setCur] = useState("IDR");
  const [notes, setNotes] = useState("Terima kasih atas kepercayaannya.");
  const [signName, setSignName] = useState("");
  const [items, setItems] = useState<Item[]>(() => [
    { id: nextId(), desc: "Jasa desain landing page", qty: 1, price: 1500000 },
    { id: nextId(), desc: "Revisi tambahan", qty: 2, price: 250000 },
  ]);
  const [toast, setToast] = useState<string | null>(null);
  const toastT = useRef<number | undefined>(undefined);

  useEffect(() => {
    document.title = "Invoice / Kwitansi — Generator";
  }, []);

  const currency = cur.trim() || "IDR";
  const fmt = useMemo(
    () => (n: number) =>
      currency === "IDR"
        ? "Rp " + Number(n || 0).toLocaleString("id-ID")
        : Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " " + currency,
    [currency],
  );

  const t = useMemo(() => {
    const sub = items.reduce((s, it) => s + it.qty * it.price, 0);
    const taxPct = digits(tax);
    const taxAmt = Math.round((sub * taxPct) / 100);
    return { sub, taxPct, tax: taxAmt, grand: sub + taxAmt };
  }, [items, tax]);

  const showToast = (m: string) => {
    setToast(m);
    clearTimeout(toastT.current);
    toastT.current = window.setTimeout(() => setToast(null), 2000);
  };

  const addItem = () => setItems((prev) => [...prev, { id: nextId(), desc: "", qty: 1, price: 0 }]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));
  const patchItem = (id: string, f: keyof Item, v: string) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, [f]: f === "desc" ? v : digits(v) } : x)));

  const save = () => {
    const data: Draft = {
      kind,
      biz: { name: bizName, addr: bizAddr },
      cli: { name: cliName, addr: cliAddr },
      no: invNo,
      date: invDate,
      tax,
      cur,
      notes,
      sign: signName,
      items: items.map(({ desc, qty, price }) => ({ desc, qty, price })),
    };
    try {
      localStorage.setItem(LS, JSON.stringify(data));
      showToast("Draft tersimpan");
    } catch {
      showToast("Gagal menyimpan");
    }
  };

  const load = () => {
    try {
      const raw = localStorage.getItem(LS);
      if (!raw) return showToast("Belum ada draft");
      const d = JSON.parse(raw) as Draft;
      setKind(d.kind || "INVOICE");
      setBizName(d.biz?.name || "");
      setBizAddr(d.biz?.addr || "");
      setCliName(d.cli?.name || "");
      setCliAddr(d.cli?.addr || "");
      setInvNo(d.no || "");
      setInvDate(d.date || "");
      setTax(d.tax ?? "0");
      setCur(d.cur || "IDR");
      setNotes(d.notes || "");
      setSignName(d.sign || "");
      setItems((d.items || []).map((it) => ({ id: nextId(), desc: it.desc, qty: it.qty, price: it.price })));
      showToast("Draft dimuat");
    } catch {
      showToast("Gagal memuat");
    }
  };

  const biz = bizName.trim() || "Usaha";
  const dateLabel = invDate
    ? new Date(invDate + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const cliLabel = (cliName.trim() || "—") + (cliAddr.trim() ? "\n" + cliAddr.trim() : "");

  return (
    <div data-tpl="invoice" className="min-h-dvh bg-[var(--i-bg)] text-[var(--i-ink)] antialiased">
      <div className="inv-app mx-auto grid max-w-[1080px] grid-cols-1 gap-5 px-4 pt-5 pb-10 min-[920px]:grid-cols-[400px_1fr] min-[920px]:items-start">
        {/* FORM */}
        <div className="inv-form">
          <h1 className="mb-0.5 text-xl tracking-[-0.02em]">Invoice / Kwitansi</h1>
          <p className="mb-4 text-[13.5px] text-[var(--i-muted)]">Isi, lalu Cetak atau simpan PDF. Semua di perangkatmu.</p>
          <div className="rounded-[14px] bg-[var(--i-card)] p-4 shadow-[inset_0_0_0_1px_var(--i-line)]">
            {/* segmented */}
            <div className="mb-3.5 flex gap-1 rounded-full bg-[var(--i-bg)] p-1 shadow-[inset_0_0_0_1px_var(--i-line)]">
              {(["INVOICE", "KWITANSI"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-current={kind === k}
                  onClick={() => setKind(k)}
                  className={[
                    "flex-1 rounded-full p-2 text-[13.5px] font-semibold",
                    kind === k ? "bg-[var(--i-ink)] text-[var(--i-card)]" : "text-[var(--i-secondary)]",
                  ].join(" ")}
                >
                  {k === "INVOICE" ? "Invoice" : "Kwitansi"}
                </button>
              ))}
            </div>

            <div className={sec + " first:mt-1"}>Usaha kamu</div>
            <div className="mb-2.5">
              <label className={label}>Nama usaha</label>
              <input className={input} value={bizName} onChange={(e) => setBizName(e.target.value)} />
            </div>
            <div className="mb-2.5">
              <label className={label}>Alamat / kontak</label>
              <textarea className={input + " min-h-[52px] resize-y"} rows={2} value={bizAddr} onChange={(e) => setBizAddr(e.target.value)} />
            </div>

            <div className={sec}>Ditagih ke</div>
            <div className="mb-2.5">
              <label className={label}>Nama pelanggan</label>
              <input className={input} value={cliName} onChange={(e) => setCliName(e.target.value)} />
            </div>
            <div className="mb-2.5">
              <label className={label}>Alamat / kontak (opsional)</label>
              <textarea className={input + " min-h-[52px] resize-y"} rows={2} value={cliAddr} onChange={(e) => setCliAddr(e.target.value)} />
            </div>

            <div className={sec}>Detail</div>
            <div className="flex gap-2.5">
              <div className="mb-2.5 flex-1">
                <label className={label}>Nomor</label>
                <input className={input} value={invNo} onChange={(e) => setInvNo(e.target.value)} />
              </div>
              <div className="mb-2.5 flex-1">
                <label className={label}>Tanggal</label>
                <input className={input} type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} />
              </div>
            </div>

            <div className={sec}>Item</div>
            <div>
              {items.map((it) => (
                <div key={it.id} className="mb-2 grid grid-cols-[1fr_52px_96px_30px] items-center gap-2">
                  <input className={input + " px-2.5 py-[9px]"} placeholder="Deskripsi" value={it.desc} onChange={(e) => patchItem(it.id, "desc", e.target.value)} />
                  <input className={input + " px-2.5 py-[9px] text-center"} inputMode="numeric" value={String(it.qty)} onChange={(e) => patchItem(it.id, "qty", e.target.value)} />
                  <input className={input + " px-2.5 py-[9px] text-right tabular-nums"} inputMode="numeric" value={String(it.price)} onChange={(e) => patchItem(it.id, "price", e.target.value)} />
                  <button
                    type="button"
                    aria-label="Hapus"
                    onClick={() => removeItem(it.id)}
                    className="grid size-[30px] place-items-center rounded-lg text-[var(--i-muted)] hover:text-[#c2410c]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="size-4">
                      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-0.5 w-full rounded-[10px] bg-[color-mix(in_srgb,var(--i-accent)_12%,transparent)] p-2.5 text-[13.5px] font-semibold text-[var(--i-accent-ink)] active:scale-[0.98]"
            >
              + Tambah baris
            </button>

            <div className={sec}>Pajak & catatan</div>
            <div className="flex gap-2.5">
              <div className="mb-2.5 flex-1">
                <label className={label}>Pajak (%)</label>
                <input className={input} inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} />
              </div>
              <div className="mb-2.5 flex-1">
                <label className={label}>Mata uang</label>
                <input className={input} value={cur} onChange={(e) => setCur(e.target.value)} />
              </div>
            </div>
            <div className="mb-2.5">
              <label className={label}>Catatan</label>
              <textarea className={input + " min-h-[52px] resize-y"} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="mb-2.5">
              <label className={label}>Nama penanda tangan</label>
              <input className={input} placeholder="Nama kamu" value={signName} onChange={(e) => setSignName(e.target.value)} />
            </div>

            <div className="mt-[18px] flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--i-ink)] p-[13px] text-[14.5px] font-bold text-[var(--i-card)] active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="size-[17px]">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
                </svg>
                Cetak / PDF
              </button>
              <button type="button" onClick={save} className="min-w-[120px] flex-1 rounded-xl bg-[var(--i-card)] p-[13px] text-[14.5px] font-bold text-[var(--i-ink)] shadow-[inset_0_0_0_1px_var(--i-line)] active:scale-[0.98]">
                Simpan
              </button>
              <button type="button" onClick={load} className="min-w-[120px] flex-1 rounded-xl bg-[var(--i-card)] p-[13px] text-[14.5px] font-bold text-[var(--i-ink)] shadow-[inset_0_0_0_1px_var(--i-line)] active:scale-[0.98]">
                Muat
              </button>
            </div>
          </div>
        </div>

        {/* PREVIEW (printable) */}
        <div className="inv-preview min-[920px]:sticky min-[920px]:top-5">
          <div className="inv-doc mx-auto max-w-[760px] rounded-2xl bg-white p-10 text-[#111] shadow-[0_10px_40px_-18px_rgba(0,0,0,0.35),inset_0_0_0_1px_var(--i-line)]">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div
                  className="mb-3 grid size-11 place-items-center rounded-xl text-xl font-extrabold text-white"
                  style={{ background: "linear-gradient(135deg, var(--i-accent), color-mix(in srgb, var(--i-accent) 50%, #f97316))" }}
                >
                  {(biz[0] || "U").toUpperCase()}
                </div>
                <div className="text-[17px] font-bold tracking-[-0.01em]">{biz}</div>
                <div className="mt-1 text-[13px] whitespace-pre-line text-[#555]">{bizAddr.trim()}</div>
              </div>
              <div className="text-right">
                <div className="text-[26px] font-extrabold tracking-[-0.02em] uppercase">{kind === "KWITANSI" ? "Kwitansi" : "Invoice"}</div>
                <div className="mt-1.5 text-[13px] text-[#555]">
                  No. <b className="font-semibold text-[#111]">{invNo.trim() || "—"}</b>
                </div>
                <div className="mt-1.5 text-[13px] text-[#555]">
                  Tanggal <b className="font-semibold text-[#111]">{dateLabel}</b>
                </div>
              </div>
            </div>

            <div className="mt-8 text-[13px] text-[#555]">
              Ditagih ke
              <div className="mt-[3px] text-[15px] font-semibold whitespace-pre-line text-[#111]">{cliLabel}</div>
            </div>

            <table className="mt-6 w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-[#e6e6ec] pb-2.5 text-left text-[11px] font-bold tracking-[0.05em] text-[#888] uppercase">Deskripsi</th>
                  <th className="border-b border-[#e6e6ec] pb-2.5 text-center text-[11px] font-bold tracking-[0.05em] text-[#888] uppercase">Qty</th>
                  <th className="border-b border-[#e6e6ec] pb-2.5 text-right text-[11px] font-bold tracking-[0.05em] text-[#888] uppercase">Harga</th>
                  <th className="border-b border-[#e6e6ec] pb-2.5 text-right text-[11px] font-bold tracking-[0.05em] text-[#888] uppercase">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {items.length ? (
                  items.map((it) => (
                    <tr key={it.id}>
                      <td className="border-b border-[#f0f0f2] py-3 align-top">{it.desc || "—"}</td>
                      <td className="border-b border-[#f0f0f2] py-3 text-center align-top tabular-nums">{it.qty}</td>
                      <td className="border-b border-[#f0f0f2] py-3 text-right align-top tabular-nums">{fmt(it.price)}</td>
                      <td className="border-b border-[#f0f0f2] py-3 text-right align-top tabular-nums">{fmt(it.qty * it.price)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-[#aaa]">
                      Belum ada item.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-[18px] ml-auto w-[min(280px,100%)] text-sm">
              <div className="flex justify-between py-1.5 text-[#555]">
                <span>Subtotal</span>
                <b className="tabular-nums">{fmt(t.sub)}</b>
              </div>
              {t.taxPct > 0 && (
                <div className="flex justify-between py-1.5 text-[#555]">
                  <span>Pajak ({t.taxPct}%)</span>
                  <b className="tabular-nums">{fmt(t.tax)}</b>
                </div>
              )}
              <div className="mt-1.5 flex justify-between border-t-2 border-[#111] pt-3 text-lg font-extrabold text-[#111]">
                <span>Total</span>
                <span className="tabular-nums">{fmt(t.grand)}</span>
              </div>
            </div>

            {notes.trim() && <div className="mt-7 text-[13px] whitespace-pre-line text-[#555]">{notes.trim()}</div>}

            <div className="mt-10 flex justify-end">
              <div className="text-center text-[13px] text-[#555]">
                <div className="mt-14 w-[170px] border-t border-[#bbb] pt-1.5">{signName.trim() || "Hormat kami"}</div>
              </div>
            </div>

            <div className="mt-8 border-t border-[#eee] pt-4 text-center text-xs text-[#999]">{biz} · dibuat dengan template Founder+</div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        className={[
          "inv-toast fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-[var(--i-ink)] px-4 py-[11px] text-[13.5px] font-semibold text-[var(--i-card)] shadow-[0_8px_30px_rgba(0,0,0,0.28)] transition-[opacity,transform] duration-200",
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2.5 opacity-0",
        ].join(" ")}
      >
        {toast}
      </div>
    </div>
  );
}
