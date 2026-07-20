import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "../../lib/BottomSheet.tsx";
import "./posmeja.css";

/* ── Persistence ── */
const LS = "fp_meja_v1";

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";
type ResStatus = "booked" | "seated" | "done" | "no_show" | "cancelled";

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  startsAt: string;
  tableCode: string | null;
  status: ResStatus;
}

interface DB {
  store: string;
  count: number;
  prefix: string;
  tables: Record<string, TableStatus>;
  reservations: Reservation[];
}

const DEF: DB = { store: "Warung Kopi Founder+", count: 8, prefix: "", tables: {}, reservations: [] };

function load(): DB {
  try {
    return { ...DEF, ...(JSON.parse(localStorage.getItem(LS) || "null") || {}) };
  } catch {
    return { ...DEF };
  }
}

const STATUSES: { key: TableStatus; label: string }[] = [
  { key: "available", label: "Kosong" },
  { key: "occupied", label: "Terisi" },
  { key: "reserved", label: "Reserved" },
  { key: "cleaning", label: "Bersihin" },
];
const statusLabel = (k: TableStatus) => (STATUSES.find((s) => s.key === k) || STATUSES[0]).label;
const RES_LABEL: Record<ResStatus, string> = {
  booked: "Booking",
  seated: "Duduk",
  done: "Selesai",
  no_show: "No-show",
  cancelled: "Batal",
};

const pad = (n: number) => String(n).padStart(2, "0");
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function defaultWhen(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return isoToLocalInput(d.toISOString());
}

export function PosMeja() {
  const [db, setDb] = useState<DB>(load);
  const [tab, setTab] = useState<"tables" | "resv">("tables");

  // Table status picker
  const [tblOpen, setTblOpen] = useState(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);

  // Reservation form
  const [resvOpen, setResvOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rNama, setRNama] = useState("");
  const [rHp, setRHp] = useState("");
  const [rPax, setRPax] = useState("");
  const [rWaktu, setRWaktu] = useState("");
  const [rMeja, setRMeja] = useState("");
  const [rStatus, setRStatus] = useState<ResStatus>("booked");

  // Setup (manage tables)
  const [setupOpen, setSetupOpen] = useState(false);
  const [sCount, setSCount] = useState("");
  const [sPrefix, setSPrefix] = useState("");
  const [sStore, setSStore] = useState("");

  // Toast
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const toastT = useRef<number | undefined>(undefined);
  const toast = (m: string) => {
    setToastMsg(m);
    setToastShow(true);
    clearTimeout(toastT.current);
    toastT.current = window.setTimeout(() => setToastShow(false), 2200);
  };

  // Persist on every change (source persists after each mutation).
  useEffect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify(db));
    } catch {
      /* ignore */
    }
  }, [db]);

  // applyChrome — document title follows the store name.
  useEffect(() => {
    document.title = "Meja — " + db.store;
  }, [db.store]);

  const tableCodes = (): string[] => {
    const out: string[] = [];
    for (let i = 1; i <= db.count; i++) out.push((db.prefix || "") + i);
    return out;
  };
  const statusOf = (code: string): TableStatus => db.tables[code] || "available";

  /* ── Table status picker ── */
  const openTblSheet = (code: string) => {
    setActiveCode(code);
    setTblOpen(true);
  };
  const setTableStatus = (code: string, next: TableStatus) => {
    setDb((prev) => ({ ...prev, tables: { ...prev.tables, [code]: next } }));
    setTblOpen(false);
    toast("Meja " + code + " → " + statusLabel(next));
  };

  /* ── Reservations ── */
  const openResvForm = (r: Reservation | null) => {
    setEditingId(r ? r.id : null);
    setRNama(r ? r.customerName : "");
    setRHp(r ? r.phone || "" : "");
    setRPax(r ? (r.partySize ? String(r.partySize) : "") : "");
    setRWaktu(r ? isoToLocalInput(r.startsAt) : defaultWhen());
    setRMeja(r ? r.tableCode || "" : "");
    setRStatus(r ? r.status : "booked");
    setResvOpen(true);
  };

  const saveResv = () => {
    const name = rNama.trim();
    const when = rWaktu;
    if (!name) {
      toast("Isi nama");
      return;
    }
    if (!when) {
      toast("Isi tanggal & jam");
      return;
    }
    const base = {
      customerName: name,
      phone: rHp.trim(),
      partySize: Number(rPax) || 1,
      startsAt: new Date(when).toISOString(),
      tableCode: rMeja || null,
      status: (editingId ? rStatus : "booked") as ResStatus,
    };

    setDb((prev) => {
      const reservations = editingId
        ? prev.reservations.map((x) => (x.id === editingId ? { ...x, ...base } : x))
        : [...prev.reservations, { ...base, id: "r" + Date.now() }];
      const tables = { ...prev.tables };
      // Seating a reservation with a table marks that table reserved/occupied.
      if (base.tableCode) {
        if (base.status === "seated") tables[base.tableCode] = "occupied";
        else if (base.status === "booked") tables[base.tableCode] = "reserved";
      }
      return { ...prev, reservations, tables };
    });

    setResvOpen(false);
    toast(editingId ? "Reservasi diperbarui" : "Reservasi ditambah");
  };

  /* ── Setup ── */
  const openSetup = () => {
    setSCount(String(db.count));
    setSPrefix(db.prefix);
    setSStore(db.store);
    setSetupOpen(true);
  };
  const saveSetup = () => {
    setDb((prev) => ({
      ...prev,
      count: Math.max(1, Math.min(200, Number(sCount) || 8)),
      prefix: sPrefix.trim(),
      store: sStore.trim() || "Toko",
    }));
    setSetupOpen(false);
    toast("Tersimpan");
  };

  const sortedResv = [...db.reservations].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  const activeStatus = activeCode ? statusOf(activeCode) : "available";

  return (
    <div data-tpl="pos-meja">
      <header className="pm-header">
        <div className="store">{db.store}</div>
        <span className="tag">Meja</span>
        <button className="icon-btn" onClick={openSetup} aria-label="Atur meja" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </header>

      <main>
        <div className="seg" role="tablist">
          <button aria-current={tab === "tables"} onClick={() => setTab("tables")} type="button">
            Meja
          </button>
          <button aria-current={tab === "resv"} onClick={() => setTab("resv")} type="button">
            Reservasi
          </button>
        </div>

        {tab === "tables" && (
          <section>
            <div className="legend">
              <span className="st-available">
                <i className="dot" /> Kosong
              </span>
              <span className="st-occupied">
                <i className="dot" /> Terisi
              </span>
              <span className="st-reserved">
                <i className="dot" /> Reserved
              </span>
              <span className="st-cleaning">
                <i className="dot" /> Bersihin
              </span>
            </div>
            <div className="grid">
              {tableCodes().map((code) => {
                const st = statusOf(code);
                return (
                  <button key={code} className={"tbl st-" + st} type="button" onClick={() => openTblSheet(code)}>
                    <div className="no">{code}</div>
                    <div className={"stt " + st}>
                      <i className={"dot " + st} />
                      {statusLabel(st)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {tab === "resv" && (
          <section>
            <div>
              {sortedResv.length === 0 ? (
                <div className="empty">Belum ada reservasi. Tap + Reservasi.</div>
              ) : (
                sortedResv.map((r) => {
                  const d = new Date(r.startsAt);
                  const hm = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                  const dm = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
                  return (
                    <div key={r.id} className="resv" onClick={() => openResvForm(r)}>
                      <div className="when">
                        <div className="hm">{hm}</div>
                        <div className="dm">{dm}</div>
                      </div>
                      <div className="info">
                        <div className="nm">{r.customerName}</div>
                        <div className="meta">
                          {(r.partySize || 1) + " orang"}
                          {r.tableCode ? " · Meja " + r.tableCode : ""}
                          {r.phone ? " · " + r.phone : ""}
                        </div>
                      </div>
                      <span className={"rtag " + r.status}>{RES_LABEL[r.status] || r.status}</span>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </main>

      {tab === "resv" && (
        <button className="fab" type="button" onClick={() => openResvForm(null)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Reservasi</span>
        </button>
      )}

      {/* Table status picker */}
      <BottomSheet
        open={tblOpen}
        onClose={() => setTblOpen(false)}
        label="Ubah status meja"
        className="bg-[var(--card)] text-[var(--ink)]"
      >
        <div className="grabber" />
        <button className="close" onClick={() => setTblOpen(false)} aria-label="Tutup" type="button">
          ✕
        </button>
        <div className="sin">
          <h3>Meja {activeCode ?? "—"}</h3>
          <div className="sub">Sekarang: {statusLabel(activeStatus)}</div>
          <div className="choices">
            {STATUSES.map((s) => (
              <button
                key={s.key}
                className="choice"
                type="button"
                onClick={() => activeCode && setTableStatus(activeCode, s.key)}
              >
                <i className={"dot " + s.key} style={{ width: 11, height: 11 }} />
                <span className="lbl">{s.label}</span>
                {s.key === activeStatus ? "✓" : ""}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* Reservation form */}
      <BottomSheet
        open={resvOpen}
        onClose={() => setResvOpen(false)}
        label="Reservasi"
        className="bg-[var(--card)] text-[var(--ink)]"
      >
        <div className="grabber" />
        <button className="close" onClick={() => setResvOpen(false)} aria-label="Tutup" type="button">
          ✕
        </button>
        <div className="sin">
          <h3>{editingId ? "Ubah reservasi" : "Reservasi baru"}</h3>
          <div className="fld">
            <label>Nama</label>
            <input value={rNama} onChange={(e) => setRNama(e.target.value)} type="text" autoComplete="name" />
          </div>
          <div className="row2">
            <div className="fld">
              <label>No. HP</label>
              <input value={rHp} onChange={(e) => setRHp(e.target.value)} inputMode="tel" placeholder="0812…" />
            </div>
            <div className="fld">
              <label>Jumlah orang</label>
              <input value={rPax} onChange={(e) => setRPax(e.target.value)} inputMode="numeric" placeholder="2" />
            </div>
          </div>
          <div className="row2">
            <div className="fld">
              <label>Tanggal & jam</label>
              <input value={rWaktu} onChange={(e) => setRWaktu(e.target.value)} type="datetime-local" />
            </div>
            <div className="fld">
              <label>Meja (opsional)</label>
              <select value={rMeja} onChange={(e) => setRMeja(e.target.value)}>
                <option value="">—</option>
                {tableCodes().map((c) => (
                  <option key={c} value={c}>
                    Meja {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {editingId && (
            <div className="fld">
              <label>Status</label>
              <select value={rStatus} onChange={(e) => setRStatus(e.target.value as ResStatus)}>
                <option value="booked">Booking</option>
                <option value="seated">Duduk (meja terisi)</option>
                <option value="done">Selesai</option>
                <option value="no_show">No-show</option>
                <option value="cancelled">Batal</option>
              </select>
            </div>
          )}
          <button className="save" onClick={saveResv} type="button">
            Simpan reservasi
          </button>
        </div>
      </BottomSheet>

      {/* Manage tables */}
      <BottomSheet
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        label="Atur meja"
        className="bg-[var(--card)] text-[var(--ink)]"
      >
        <div className="grabber" />
        <button className="close" onClick={() => setSetupOpen(false)} aria-label="Tutup" type="button">
          ✕
        </button>
        <div className="sin">
          <h3>Atur meja</h3>
          <div className="sub">Jumlah meja & prefix. Status yang ada tetap tersimpan.</div>
          <div className="row2">
            <div className="fld">
              <label>Jumlah meja</label>
              <input value={sCount} onChange={(e) => setSCount(e.target.value)} inputMode="numeric" />
            </div>
            <div className="fld">
              <label>Prefix (opsional)</label>
              <input value={sPrefix} onChange={(e) => setSPrefix(e.target.value)} type="text" placeholder="mis. A" />
            </div>
          </div>
          <div className="fld">
            <label>Nama toko</label>
            <input value={sStore} onChange={(e) => setSStore(e.target.value)} type="text" />
          </div>
          <button className="save" onClick={saveSetup} type="button">
            Simpan
          </button>
        </div>
      </BottomSheet>

      <div className={"toast" + (toastShow ? " show" : "")}>{toastMsg}</div>
    </div>
  );
}
