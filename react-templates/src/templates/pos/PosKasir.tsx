import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import qrcode from "qrcode-generator";
import { formatCurrency } from "../../lib/format.ts";
import {
  toDynamicQris,
  escposBytes,
  receiptText,
  printBluetooth,
  roundUps,
  rekapText,
  sameDay,
} from "./kasir-lib.ts";
import type { ReceiptModel, Txn } from "./kasir-lib.ts";
import "./poskasir.css";

// ═══════════════════════════ STATE MODEL ═══════════════════════════
const LS_KEY = "fp_kasir_settings_v1";
const TXN_KEY = "fp_kasir_txns_v1";

interface Bank {
  bank: string;
  number: string;
  holder: string;
}
interface Settings {
  store: string;
  address: string;
  footer: string;
  qrisPayload: string;
  banks: Bank[];
  paperWidth: number; // chars: 32 (58mm) | 48 (80mm)
}
interface Item {
  id: string;
  name: string;
  price: number;
  qty: number;
}
type Mode = "amount" | "items";
type PayMethod = "QRIS" | "Transfer" | "Tunai" | null;

const DEFAULTS: Settings = {
  store: "Warung Kopi Founder+",
  address: "",
  footer: "Terima kasih!",
  qrisPayload: "",
  banks: [],
  paperWidth: 32,
};

const fmt = (n: number): string => formatCurrency(n);

function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(LS_KEY) || "null") || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}
function persist(s: Settings): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
function loadTxns(): Txn[] {
  try {
    return (JSON.parse(localStorage.getItem(TXN_KEY) || "null") as Txn[]) || [];
  } catch {
    return [];
  }
}
function saveTxns(a: Txn[]): void {
  try {
    localStorage.setItem(TXN_KEY, JSON.stringify(a.slice(0, 1000)));
  } catch {
    /* ignore */
  }
}

// QRIS SVG (offline, dependency-free encoder) — same call as the source.
function qrSvg(text: string): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
}

function copyText(t: string): void {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t);
      return;
    }
  } catch {
    /* ignore */
  }
  const ta = document.createElement("textarea");
  ta.value = t;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    /* ignore */
  }
  ta.remove();
}

// ═══════════════════════════ ICONS (inline, monochrome) ═══════════════════════════
const svgBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const IconCamera = () => (
  <svg {...svgBase}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);
const IconTrash = () => (
  <svg {...svgBase}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

// Native <dialog> driven from an `open` prop; scoped CSS lives in poskasir.css.
function KasirDialog({
  open,
  onClose,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={className}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {children}
    </dialog>
  );
}

// ═══════════════════════════ COMPONENT ═══════════════════════════
export function PosKasir() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [txns, setTxns] = useState<Txn[]>(loadTxns);

  const [mode, setMode] = useState<Mode>("amount");
  const [amountDigits, setAmountDigits] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  // Current sale payment state.
  const [payMethod, setPayMethod] = useState<PayMethod>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [cReceived, setCReceived] = useState(""); // Tunai — typed amount

  // Add-item form.
  const [inName, setInName] = useState("");
  const [inPrice, setInPrice] = useState("");
  const inNameRef = useRef<HTMLInputElement>(null);

  // Dialog open flags.
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [qrisOpen, setQrisOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // QRIS + success captured display state.
  const [qris, setQris] = useState<{ svg: string; dynamic: boolean; total: number } | null>(null);
  const [successAmt, setSuccessAmt] = useState("Rp 0");
  const [successMethod, setSuccessMethod] = useState("QRIS");

  // Settings form draft (applied on Save; banks persist immediately).
  const [dStore, setDStore] = useState("");
  const [dAddr, setDAddr] = useState("");
  const [dFooter, setDFooter] = useState("");
  const [dQris, setDQris] = useState("");
  const [dPaperWidth, setDPaperWidth] = useState(32);
  const [bkBank, setBkBank] = useState("");
  const [bkNum, setBkNum] = useState("");
  const [bkHolder, setBkHolder] = useState("");

  // Toast.
  const [toastState, setToastState] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toast = (msg: string): void => {
    setToastState({ msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState((s) => ({ ...s, show: false })), 2200);
  };

  const printPaperRef = useRef<HTMLDivElement>(null);

  // ── Persist + chrome ──
  useEffect(() => {
    persist(settings);
  }, [settings]);
  useEffect(() => {
    document.title = "Kasir — " + settings.store;
  }, [settings.store]);

  // ── Derived totals ──
  const cashReceived = useMemo(
    () => Number(String(cReceived).replace(/[^\d]/g, "")) || 0,
    [cReceived],
  );
  const amountValue = Number(amountDigits || 0);
  const currentTotal = useMemo(
    () => (mode === "amount" ? Number(amountDigits || 0) : items.reduce((s, it) => s + it.price * it.qty, 0)),
    [mode, amountDigits, items],
  );
  const currentLines = useMemo(() => {
    if (mode === "amount") {
      const t = Number(amountDigits || 0);
      return t > 0 ? [{ name: "Pembayaran", qty: 1, price: t }] : [];
    }
    return items.map((it) => ({ name: it.name, qty: it.qty, price: it.price }));
  }, [mode, amountDigits, items]);

  const payLabel = (): string => {
    if (payMethod === "Tunai") return "Tunai";
    if (payMethod === "Transfer") return "Transfer";
    return "QRIS";
  };

  // ── Keypad + items ──
  const pressKey = (k: string): void => {
    setAmountDigits((prev) => {
      if (k === "del") return prev.slice(0, -1);
      if (k === "000") return prev ? prev + "000" : prev;
      return (prev + k).replace(/^0+/, "").slice(0, 12);
    });
  };
  const addItemFromForm = (): void => {
    const name = inName.trim();
    const price = Number(String(inPrice).replace(/[^\d]/g, ""));
    if (!name || !(price > 0)) {
      toast("Isi nama & harga barang");
      return;
    }
    setItems((prev) => [
      ...prev,
      { id: "i" + Date.now() + Math.round(performance.now()), name, price, qty: 1 },
    ]);
    setInName("");
    setInPrice("");
    inNameRef.current?.focus();
  };
  const stepItem = (id: string, delta: 1 | -1): void => {
    setItems((prev) =>
      prev.flatMap((it) => {
        if (it.id !== id) return [it];
        const qty = it.qty + delta;
        return qty <= 0 ? [] : [{ ...it, qty }];
      }),
    );
  };

  // ── Payment flow ──
  const openMethods = (): void => {
    if (currentTotal <= 0) return;
    setMethodsOpen(true);
  };
  const showQris = (): void => {
    setPayMethod("QRIS");
    const total = currentTotal;
    if (total <= 0) return;
    let payload: string | null = null;
    if (settings.qrisPayload.trim()) payload = toDynamicQris(settings.qrisPayload, total);
    if (payload) {
      setQris({ svg: qrSvg(payload), dynamic: true, total });
    } else {
      setQris({ svg: qrSvg(`Tagihan ${settings.store}: ${fmt(total)}`), dynamic: false, total });
    }
    setQrisOpen(true);
  };
  const showTransfer = (): void => {
    setPayMethod("Transfer");
    setTransferOpen(true);
  };
  const showCash = (): void => {
    setPayMethod("Tunai");
    setCReceived("");
    setCashOpen(true);
  };

  const recordSale = (): void => {
    const d = new Date();
    const txn: Txn = {
      id: "t" + d.getTime(),
      ts: d.toISOString(),
      method: payLabel(),
      total: currentTotal,
      cashReceived: payMethod === "Tunai" ? cashReceived : 0,
      change: payMethod === "Tunai" ? Math.max(0, cashReceived - currentTotal) : 0,
      proof: !!proofUrl,
      items: currentLines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
    };
    setTxns((prev) => {
      const all = [txn, ...prev];
      saveTxns(all);
      return all.slice(0, 1000);
    });
  };
  // Clean success confirmation; the sale stays intact (so the receipt can
  // print) until the success sheet closes, which resets for the next order.
  const finishSale = (): void => {
    recordSale();
    setSuccessAmt(fmt(currentTotal));
    setSuccessMethod(payLabel() + (proofUrl ? " · bukti terlampir" : ""));
    setSuccessOpen(true);
  };
  const resetSale = (): void => {
    setAmountDigits("");
    setItems([]);
    setPayMethod(null);
    setCReceived("");
    setProofUrl(null);
  };

  // ── Receipt / printing ──
  const receiptModel = (): ReceiptModel => ({
    store: settings.store,
    address: settings.address,
    footer: settings.footer,
    lines: currentLines,
    total: currentTotal,
    width: settings.paperWidth,
    method: payLabel(),
    cashReceived: payMethod === "Tunai" ? cashReceived : 0,
    change: payMethod === "Tunai" ? Math.max(0, cashReceived - currentTotal) : 0,
    proof: !!proofUrl,
    time: new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
  const printReceipt = async (): Promise<void> => {
    if (currentTotal <= 0) return;
    const m = receiptModel();
    if ("bluetooth" in navigator) {
      try {
        toast("Pilih printer…");
        await printBluetooth(escposBytes(m));
        toast("Struk tercetak");
        return;
      } catch (err) {
        if (err && (err as { name?: string }).name === "NotFoundError") {
          toast("Batal pilih printer");
          return;
        }
        toast("Bluetooth gagal — pakai print biasa");
        // fall through to print() fallback
      }
    } else {
      toast("Web Bluetooth tak didukung — pakai print biasa");
    }
    // Fallback: OS print dialog (works on iOS/desktop; can hit AirPrint / PDF).
    if (printPaperRef.current) printPaperRef.current.textContent = receiptText(m);
    window.print();
  };

  // ── Payment proof (foto bukti) ──
  const pickProof = (): void => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.capture = "environment";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        setProofUrl(rd.result as string);
        toast("Bukti dilampirkan");
      };
      rd.readAsDataURL(f);
    };
    inp.click();
  };
  const downloadProof = (): void => {
    if (!proofUrl) return;
    const a = document.createElement("a");
    a.href = proofUrl;
    a.download = "bukti-bayar-" + Date.now() + ".png";
    a.click();
  };

  // ── History ──
  const today = useMemo(() => txns.filter((t) => sameDay(t.ts, new Date())), [txns]);
  const todayTotal = today.reduce((s, t) => s + t.total, 0);
  const exportCsv = (): void => {
    const all = txns;
    if (!all.length) {
      toast("Belum ada transaksi");
      return;
    }
    const head = ["waktu", "metode", "total", "uang_diterima", "kembalian", "bukti", "items"];
    const rows = all.map((t) =>
      [
        new Date(t.ts).toLocaleString("id-ID"),
        t.method,
        t.total,
        t.cashReceived,
        t.change,
        t.proof ? "ya" : "",
        t.items.map((i) => `${i.qty}x ${i.name}`).join(" | "),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [head.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "riwayat-kasir-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const printRekap = (): void => {
    if (printPaperRef.current)
      printPaperRef.current.textContent = rekapText(today, settings.store, settings.paperWidth);
    window.print();
  };
  const clearHistory = (): void => {
    if (!txns.length) {
      toast("Riwayat kosong");
      return;
    }
    if (!confirm("Hapus semua riwayat transaksi? Tindakan ini tidak bisa dibatalkan.")) return;
    saveTxns([]);
    setTxns([]);
    toast("Riwayat dihapus");
  };

  // ── Settings ──
  const openSettings = (): void => {
    setDStore(settings.store);
    setDAddr(settings.address);
    setDFooter(settings.footer);
    setDQris(settings.qrisPayload);
    setDPaperWidth(settings.paperWidth);
    setSettingsOpen(true);
  };
  const draftFromForm = (): Omit<Settings, "banks"> => ({
    store: dStore.trim() || "Toko",
    address: dAddr.trim(),
    footer: dFooter.trim(),
    qrisPayload: dQris.trim(),
    paperWidth: dPaperWidth,
  });
  const saveSettings = (): void => {
    setSettings((s) => ({ ...s, ...draftFromForm() }));
    setSettingsOpen(false);
    toast("Pengaturan tersimpan");
  };
  const addBank = (): void => {
    const bank = bkBank.trim();
    const number = bkNum.trim().replace(/\s+/g, "");
    const holder = bkHolder.trim();
    if (!bank || !number) {
      toast("Isi bank & no. rekening");
      return;
    }
    setSettings((s) => ({ ...s, banks: [...s.banks, { bank, number, holder }] }));
    setBkBank("");
    setBkNum("");
    toast("Rekening ditambah");
  };
  const delBank = (i: number): void => {
    setSettings((s) => ({ ...s, banks: s.banks.filter((_, idx) => idx !== i) }));
  };

  // Live receipt preview (settings sheet).
  const previewText = useMemo(() => {
    const d = { store: dStore.trim() || "Toko", address: dAddr.trim(), footer: dFooter.trim(), paperWidth: dPaperWidth };
    const sample: ReceiptModel = {
      store: d.store,
      address: d.address,
      footer: d.footer,
      width: d.paperWidth,
      time: "01 Jan 2026, 09:41",
      method: payLabel(),
      cashReceived: 0,
      change: 0,
      proof: false,
      lines: currentLines.length
        ? currentLines
        : [
            { name: "Kopi Susu", qty: 2, price: 22000 },
            { name: "Croissant", qty: 1, price: 20000 },
          ],
      total: currentTotal || 64000,
    };
    return receiptText(sample);
  }, [dStore, dAddr, dFooter, dPaperWidth, currentLines, currentTotal, payMethod]);

  const proofSlot = (): ReactNode =>
    !proofUrl ? (
      <button className="proof-drop" type="button" onClick={pickProof}>
        <IconCamera /> Lampirkan foto bukti pembayaran
      </button>
    ) : (
      <>
        <div className="proof-thumb">
          <img src={proofUrl} alt="Bukti pembayaran" />
          <button className="rm" type="button" aria-label="Hapus" onClick={() => setProofUrl(null)}>
            ✕
          </button>
        </div>
        <div className="proof-actions">
          <button className="mini" type="button" onClick={pickProof}>
            Ganti foto
          </button>
          <button className="mini" type="button" onClick={downloadProof}>
            Unduh bukti
          </button>
        </div>
      </>
    );

  const transferSub = settings.banks.length
    ? "Ke " + settings.banks.map((b) => b.bank).join(" / ")
    : "Tambah rekening di Pengaturan dulu";

  // ═══════════════════════════ RENDER ═══════════════════════════
  return (
    <div data-tpl="pos-kasir">
      <header>
        <div className="store">{settings.store}</div>
        <span className="tag">Kasir</span>
        <button className="icon-btn" aria-label="Riwayat" onClick={() => setHistoryOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v5h5" />
            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
            <path d="M12 7v5l4 2" />
          </svg>
        </button>
        <button className="icon-btn" aria-label="Pengaturan" onClick={openSettings}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </header>

      <main>
        <div className="seg" role="tablist">
          <button aria-current={mode === "amount"} type="button" onClick={() => setMode("amount")}>
            Nominal
          </button>
          <button aria-current={mode === "items"} type="button" onClick={() => setMode("items")}>
            Barang
          </button>
        </div>

        {/* Nominal mode */}
        <section hidden={mode !== "amount"}>
          <div className="amount">
            {amountValue > 0 ? fmt(amountValue) : <span className="z">Rp 0</span>}
          </div>
          <div className="amount-cap">Ketik nominal yang harus dibayar</div>
          <div className="keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "del"].map((k) => (
              <button key={k} className="key" type="button" onClick={() => pressKey(k)}>
                {k === "del" ? "⌫" : k}
              </button>
            ))}
          </div>
        </section>

        {/* Items mode */}
        <section hidden={mode !== "items"}>
          <div className="items">
            {items.length === 0 ? (
              <div className="empty">Belum ada barang. Tambah di bawah</div>
            ) : (
              items.map((it) => (
                <div className="irow" key={it.id}>
                  <div className="info">
                    <div className="nm">{it.name}</div>
                    <div className="pr">
                      {fmt(it.price)} × {it.qty} = {fmt(it.price * it.qty)}
                    </div>
                  </div>
                  <div className="stp">
                    <button type="button" aria-label="Kurangi" onClick={() => stepItem(it.id, -1)}>
                      −
                    </button>
                    <span className="q">{it.qty}</span>
                    <button type="button" aria-label="Tambah" onClick={() => stepItem(it.id, 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="add-item">
            <input
              ref={inNameRef}
              type="text"
              placeholder="Nama barang"
              value={inName}
              onChange={(e) => setInName(e.target.value)}
            />
            <input
              className="price"
              inputMode="numeric"
              placeholder="Harga"
              value={inPrice}
              onChange={(e) => setInPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItemFromForm();
              }}
            />
            <button className="addbtn" type="button" onClick={addItemFromForm}>
              Tambah
            </button>
          </div>
        </section>
      </main>

      <div className="bar">
        <div className="in">
          <div className="actions">
            <button className="print" type="button" disabled={currentTotal <= 0} onClick={printReceipt}>
              Struk
            </button>
            <button className="qris" type="button" disabled={currentTotal <= 0} onClick={openMethods}>
              <span className="lbl">Bayar</span>
              <span className="amt">{fmt(currentTotal)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QRIS modal */}
      <KasirDialog open={qrisOpen} onClose={() => setQrisOpen(false)} className="d-qris">
        <button className="close" aria-label="Tutup" onClick={() => setQrisOpen(false)}>
          ✕
        </button>
        <div className="qwrap">
          <div className="qtitle">{settings.store}</div>
          <div className="qamt">{fmt(qris ? qris.total : 0)}</div>
          <div className="qsub">Scan untuk bayar</div>
          <div className="qbox" dangerouslySetInnerHTML={{ __html: qris ? qris.svg : "" }} />
          <div className="qlogo">QRIS · GoPay · OVO · DANA · ShopeePay · m-banking</div>
          <div className="qnote">
            {qris && qris.dynamic ? (
              <>
                QRIS dinamis — nominal <b>{fmt(qris.total)}</b> sudah termasuk. Pelanggan tinggal scan &amp; konfirmasi.
              </>
            ) : (
              <>
                Belum ada payload QRIS di Pengaturan, jadi ini <b>bukan QRIS</b>. Tampilkan QRIS statis tokomu ke pelanggan lalu minta ketik nominal <b>{fmt(qris ? qris.total : 0)}</b>. Isi payload QRIS di Pengaturan untuk QRIS dinamis otomatis.
              </>
            )}
          </div>
          <div className="qactions">
            <button className="pr" type="button" onClick={printReceipt}>
              Cetak struk
            </button>
            <button
              className="done"
              type="button"
              onClick={() => {
                setQrisOpen(false);
                finishSale();
              }}
            >
              Selesai
            </button>
          </div>
        </div>
      </KasirDialog>

      {/* Payment method picker */}
      <KasirDialog open={methodsOpen} onClose={() => setMethodsOpen(false)} className="d-methods">
        <div className="grabber" />
        <button className="close" aria-label="Tutup" onClick={() => setMethodsOpen(false)}>
          ✕
        </button>
        <div className="sin">
          <h3>Metode bayar · {fmt(currentTotal)}</h3>
          <button
            className="method"
            type="button"
            onClick={() => {
              setMethodsOpen(false);
              setPayMethod("QRIS");
              showQris();
            }}
          >
            <span className="mi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect width="5" height="5" x="3" y="3" rx="1" />
                <rect width="5" height="5" x="16" y="3" rx="1" />
                <rect width="5" height="5" x="3" y="16" rx="1" />
                <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                <path d="M21 21v.01" />
                <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                <path d="M3 12h.01" />
                <path d="M12 3h.01" />
                <path d="M12 16v.01" />
                <path d="M16 12h1" />
                <path d="M21 12v.01" />
                <path d="M12 21v-1" />
              </svg>
            </span>
            <span className="mt">
              <span className="ml">QRIS</span>
              <span className="ms">GoPay, OVO, DANA, m-banking</span>
            </span>
            <span className="chev">›</span>
          </button>
          <button
            className="method"
            type="button"
            onClick={() => {
              setMethodsOpen(false);
              showTransfer();
            }}
          >
            <span className="mi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" x2="21" y1="22" y2="22" />
                <line x1="6" x2="6" y1="18" y2="11" />
                <line x1="10" x2="10" y1="18" y2="11" />
                <line x1="14" x2="14" y1="18" y2="11" />
                <line x1="18" x2="18" y1="18" y2="11" />
                <polygon points="12 2 20 7 4 7" />
              </svg>
            </span>
            <span className="mt">
              <span className="ml">Transfer bank</span>
              <span className="ms">{transferSub}</span>
            </span>
            <span className="chev">›</span>
          </button>
          <button
            className="method"
            type="button"
            onClick={() => {
              setMethodsOpen(false);
              showCash();
            }}
          >
            <span className="mi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="12" x="2" y="6" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
            </span>
            <span className="mt">
              <span className="ml">Tunai</span>
              <span className="ms">Bayar cash + hitung kembalian</span>
            </span>
            <span className="chev">›</span>
          </button>
        </div>
      </KasirDialog>

      {/* Bank transfer */}
      <KasirDialog open={transferOpen} onClose={() => setTransferOpen(false)} className="d-transfer">
        <div className="grabber" />
        <button className="close" aria-label="Tutup" onClick={() => setTransferOpen(false)}>
          ✕
        </button>
        <div className="sin">
          <h3>Transfer bank</h3>
          <div className="pay-amt">{fmt(currentTotal)}</div>
          <div className="pay-cap">Transfer nominal di atas ke salah satu rekening</div>
          <div>
            {!settings.banks.length ? (
              <div className="empty">Belum ada rekening. Tambah di Pengaturan → Rekening bank.</div>
            ) : (
              settings.banks.map((b, i) => (
                <div className="bank" key={i}>
                  <div className="binfo">
                    <div className="bname">{b.bank}</div>
                    <div className="bnum">{b.number}</div>
                    <div className="bhold">a.n. {b.holder || "-"}</div>
                  </div>
                  <button
                    className="copy"
                    type="button"
                    onClick={() => {
                      copyText(b.number);
                      toast("No. rekening disalin");
                    }}
                  >
                    Salin
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="sec">Bukti pembayaran</div>
          <div className="proof">{proofSlot()}</div>
          <div className="qactions" style={{ marginTop: 16 }}>
            <button className="pr" type="button" onClick={printReceipt}>
              Cetak struk
            </button>
            <button
              className="done"
              type="button"
              onClick={() => {
                setTransferOpen(false);
                finishSale();
              }}
            >
              Selesai
            </button>
          </div>
        </div>
      </KasirDialog>

      {/* Cash */}
      <KasirDialog open={cashOpen} onClose={() => setCashOpen(false)} className="d-cash">
        <div className="grabber" />
        <button className="close" aria-label="Tutup" onClick={() => setCashOpen(false)}>
          ✕
        </button>
        <div className="sin">
          <h3>Tunai</h3>
          <div className="pay-amt">{fmt(currentTotal)}</div>
          <div className="pay-cap">Total yang harus dibayar</div>
          <div className="fld">
            <label>Uang diterima</label>
            <input
              inputMode="numeric"
              placeholder="0"
              value={cReceived}
              onChange={(e) => setCReceived(e.target.value)}
            />
          </div>
          <div className="chips">
            {[{ l: "Uang pas", v: currentTotal }, ...roundUps(currentTotal).map((v) => ({ l: fmt(v), v }))].map(
              (o, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCReceived(Number(o.v).toLocaleString("id-ID"))}
                >
                  {o.l}
                </button>
              ),
            )}
          </div>
          <div className="change">
            <span className="cl">Kembalian</span>
            <span className="cv">{fmt(Math.max(0, cashReceived - currentTotal))}</span>
          </div>
          <div className="proof" style={{ marginTop: 14 }}>
            {proofSlot()}
          </div>
          <div className="qactions" style={{ marginTop: 16 }}>
            <button className="pr" type="button" onClick={printReceipt}>
              Cetak struk
            </button>
            <button
              className="done"
              type="button"
              onClick={() => {
                if (cashReceived < currentTotal) {
                  toast("Uang diterima kurang dari total");
                  return;
                }
                setCashOpen(false);
                finishSale();
              }}
            >
              Selesai
            </button>
          </div>
        </div>
      </KasirDialog>

      {/* Payment success */}
      <KasirDialog
        open={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          resetSale();
        }}
        className="d-success"
      >
        <div className="okwrap">
          <div className="okcheck">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <div className="oktitle">Pembayaran diterima</div>
          <div className="okamt">{successAmt}</div>
          <div className="oksub">{successMethod}</div>
          <div className="qactions">
            <button className="pr" type="button" onClick={printReceipt}>
              Cetak struk
            </button>
            <button className="done" type="button" onClick={() => setSuccessOpen(false)}>
              Transaksi baru
            </button>
          </div>
        </div>
      </KasirDialog>

      {/* Settings sheet */}
      <KasirDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} className="d-settings">
        <div className="grabber" />
        <button className="close" aria-label="Tutup" onClick={() => setSettingsOpen(false)}>
          ✕
        </button>
        <div className="sin">
          <h3>Pengaturan</h3>

          <div className="sec">Info toko</div>
          <div className="fld">
            <label>Nama toko</label>
            <input type="text" value={dStore} onChange={(e) => setDStore(e.target.value)} />
          </div>
          <div className="fld">
            <label>Alamat / telepon (struk)</label>
            <input type="text" placeholder="Jl. … · 0812…" value={dAddr} onChange={(e) => setDAddr(e.target.value)} />
          </div>
          <div className="fld">
            <label>Catatan bawah struk</label>
            <input
              type="text"
              placeholder="Terima kasih! Sampai jumpa lagi"
              value={dFooter}
              onChange={(e) => setDFooter(e.target.value)}
            />
          </div>

          <div className="sec">QRIS</div>
          <div className="fld">
            <label>Payload QRIS statis (opsional)</label>
            <textarea placeholder="00020101021126…6304XXXX" value={dQris} onChange={(e) => setDQris(e.target.value)} />
            <div className="hint">
              Tempel isi teks dari QRIS statis merchant-mu (scan QRIS-mu sekali pakai app pemindai untuk lihat teksnya, atau minta ke penyedia QRIS). Kalau diisi, kasir bikin <b>QRIS dinamis</b> otomatis dengan nominal + CRC yang benar. Kalau kosong, QRIS tampil sebagai kode nominal-saja (pelanggan ketik nominal manual).
            </div>
          </div>

          <div className="sec">Rekening bank (transfer)</div>
          <div>
            {!settings.banks.length ? (
              <div className="hint" style={{ margin: "2px 0 8px" }}>
                Belum ada rekening.
              </div>
            ) : (
              settings.banks.map((b, i) => (
                <div className="bank" key={i}>
                  <div className="binfo">
                    <div className="bname">{b.bank}</div>
                    <div className="bnum">{b.number}</div>
                    <div className="bhold">a.n. {b.holder || "-"}</div>
                  </div>
                  <button className="del" type="button" aria-label="Hapus" onClick={() => delBank(i)}>
                    <IconTrash />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="add-item" style={{ marginTop: 2 }}>
            <input
              type="text"
              placeholder="Bank (mis. BCA)"
              style={{ flex: "0 0 120px" }}
              value={bkBank}
              onChange={(e) => setBkBank(e.target.value)}
            />
            <input
              inputMode="numeric"
              placeholder="No. rekening"
              value={bkNum}
              onChange={(e) => setBkNum(e.target.value)}
            />
            <button className="addbtn" type="button" onClick={addBank}>
              +
            </button>
          </div>
          <div className="fld" style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="Atas nama (dipakai untuk rekening yang ditambah)"
              value={bkHolder}
              onChange={(e) => setBkHolder(e.target.value)}
            />
          </div>
          <div className="hint">
            Rekeningmu ditampilkan ke pelanggan saat pilih <b>Transfer bank</b>, lengkap tombol salin. Semua tersimpan di HP ini saja.
          </div>

          <div className="sec">Struk</div>
          <div className="fld">
            <label>Lebar kertas</label>
            <div className="seg2">
              <button type="button" aria-current={dPaperWidth === 32} onClick={() => setDPaperWidth(32)}>
                58 mm
              </button>
              <button type="button" aria-current={dPaperWidth === 48} onClick={() => setDPaperWidth(48)}>
                80 mm
              </button>
            </div>
          </div>
          <div className="fld">
            <label>Pratinjau struk</label>
            <div className="rcpt">{previewText}</div>
          </div>

          <button className="save" type="button" onClick={saveSettings}>
            Simpan
          </button>
        </div>
      </KasirDialog>

      {/* Riwayat + rekap harian */}
      <KasirDialog open={historyOpen} onClose={() => setHistoryOpen(false)} className="d-history">
        <div className="grabber" />
        <button className="close" aria-label="Tutup" onClick={() => setHistoryOpen(false)}>
          ✕
        </button>
        <div className="sin">
          <h3>
            Riwayat ·{" "}
            {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </h3>
          <div className="rekap">
            <div className="rekap-total">
              <span className="rl">Total hari ini</span>
              <span className="rv">{fmt(todayTotal)}</span>
            </div>
            <div className="rekap-grid">
              {["QRIS", "Transfer", "Tunai"].map((m) => {
                const rows = today.filter((t) => t.method === m);
                const sum = rows.reduce((s, t) => s + t.total, 0);
                return (
                  <div className="cell" key={m}>
                    <div className="k">{m}</div>
                    <div className="n">{fmt(sum)}</div>
                    <div className="c">{rows.length} transaksi</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rekap-actions">
            <button className="mini" type="button" onClick={printRekap}>
              Cetak rekap
            </button>
            <button className="mini" type="button" onClick={exportCsv}>
              Export CSV
            </button>
            <button className="mini danger" type="button" onClick={clearHistory}>
              Hapus semua
            </button>
          </div>
          <div className="sec">Transaksi</div>
          <div>
            {!today.length ? (
              <div className="empty">Belum ada transaksi hari ini.</div>
            ) : (
              today.map((t) => {
                const time = new Date(t.ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                const desc =
                  t.items.length === 1 && t.items[0].name === "Pembayaran"
                    ? "Nominal"
                    : t.items.map((i) => `${i.qty}× ${i.name}`).join(", ");
                return (
                  <div className="txn" key={t.id}>
                    <div className="tm">
                      <div className="t1">{fmt(t.total)}</div>
                      <div className="t2">
                        {time} · {desc}
                        {t.proof ? " · bukti" : ""}
                      </div>
                    </div>
                    <span className="mtag">{t.method}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </KasirDialog>

      <div className={`toast${toastState.show ? " show" : ""}`}>{toastState.msg}</div>

      {createPortal(
        <div className="fp-kasir-print">
          <div className="paper" ref={printPaperRef} />
        </div>,
        document.body,
      )}
    </div>
  );
}
