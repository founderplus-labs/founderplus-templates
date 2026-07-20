import { useEffect, useMemo, useRef, useState } from "react";
import { BottomSheet } from "../../lib/BottomSheet.tsx";
import "./posservis.css";

/* ══════════════════════════ MODEL ══════════════════════════ */
const LS = "fp_servis_v1";

interface Ticket {
  id: string;
  code: string;
  status: string;
  title: string;
  customerName: string;
  phone: string;
  price: number;
  scheduledAt: string | null;
  note: string;
  priority: boolean;
  createdAt: string;
}
interface DB {
  store: string;
  seq: number;
  tickets: Ticket[];
}
const DEF: DB = { store: "Founder+ Servis", seq: 0, tickets: [] };

function load(): DB {
  try {
    return { ...DEF, ...(JSON.parse(localStorage.getItem(LS) || "null") || {}) };
  } catch {
    return { ...DEF };
  }
}

const fmt = (n: number) => "Rp " + Number(n || 0).toLocaleString("id-ID");

const STATUSES = [
  { key: "new", label: "Baru" },
  { key: "scheduled", label: "Dijadwalkan" },
  { key: "in_progress", label: "Dikerjakan" },
  { key: "done", label: "Selesai" },
  { key: "cancelled", label: "Batal" },
];
const stLabel = (k: string) => (STATUSES.find((s) => s.key === k) || STATUSES[0]).label;

const FILTERS: { key: string; label: string; match: (t: Ticket) => boolean }[] = [
  { key: "all", label: "Semua", match: () => true },
  { key: "open", label: "Aktif", match: (t) => ["new", "scheduled", "in_progress"].includes(t.status) },
  { key: "in_progress", label: "Dikerjakan", match: (t) => t.status === "in_progress" },
  { key: "done", label: "Selesai", match: (t) => t.status === "done" },
];

function whenText(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function isoToLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ══════════════════════════ ICONS ══════════════════════════ */
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* ══════════════════════════ COMPONENT ══════════════════════════ */
export function PosServis() {
  const [db, setDb] = useState<DB>(() => load());
  const [filter, setFilter] = useState("open");

  // Persist whenever db changes.
  useEffect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify(db));
    } catch {
      /* ignore */
    }
  }, [db]);

  // Chrome (title).
  useEffect(() => {
    document.title = "Servis — " + db.store;
  }, [db.store]);

  /* ── Toast ── */
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  function toast(m: string) {
    setToastMsg(m);
    setToastShow(true);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToastShow(false), 2200);
  }

  /* ── Filters + list ── */
  const activeFilter = FILTERS.find((x) => x.key === filter) || FILTERS[0];
  const items = useMemo(() => {
    return db.tickets
      .filter(activeFilter.match)
      .slice()
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [db.tickets, activeFilter]);

  /* ── Detail sheet ── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTicket = db.tickets.find((t) => t.id === activeId) || null;

  function openDetail(t: Ticket) {
    setActiveId(t.id);
    setDetailOpen(true);
  }
  function setStatus(key: string) {
    if (!activeTicket) return;
    const code = activeTicket.code;
    setDb((d) => ({
      ...d,
      tickets: d.tickets.map((x) => (x.id === activeId ? { ...x, status: key } : x)),
    }));
    toast(code + " → " + stLabel(key));
  }
  function deleteActive() {
    if (!confirm("Hapus tiket ini?")) return;
    setDb((d) => ({ ...d, tickets: d.tickets.filter((x) => x.id !== activeId) }));
    setDetailOpen(false);
    toast("Tiket dihapus");
  }

  /* ── Form sheet ── */
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fJob, setFJob] = useState("");
  const [fCust, setFCust] = useState("");
  const [fHp, setFHp] = useState("");
  const [fPrice, setFPrice] = useState("");
  const [fWhen, setFWhen] = useState("");
  const [fNote, setFNote] = useState("");
  const [fPrio, setFPrio] = useState(false);

  function openForm(t: Ticket | null) {
    setEditingId(t ? t.id : null);
    setFJob(t ? t.title : "");
    setFCust(t ? t.customerName || "" : "");
    setFHp(t ? t.phone || "" : "");
    setFPrice(t && t.price ? String(t.price) : "");
    setFWhen(t && t.scheduledAt ? isoToLocal(t.scheduledAt) : "");
    setFNote(t ? t.note || "" : "");
    setFPrio(t ? !!t.priority : false);
    setFormOpen(true);
  }
  function saveForm() {
    const title = fJob.trim();
    if (!title) {
      toast("Isi jenis servis");
      return;
    }
    const data = {
      title,
      customerName: fCust.trim(),
      phone: fHp.trim(),
      price: Number(String(fPrice).replace(/[^\d]/g, "")) || 0,
      scheduledAt: fWhen ? new Date(fWhen).toISOString() : null,
      note: fNote.trim(),
      priority: fPrio,
    };
    if (editingId) {
      setDb((d) => ({
        ...d,
        tickets: d.tickets.map((x) => (x.id === editingId ? { ...x, ...data } : x)),
      }));
      toast("Tiket diperbarui");
    } else {
      setDb((d) => {
        const seq = d.seq + 1;
        const ticket: Ticket = {
          id: "s" + Date.now(),
          code: "S-" + String(seq).padStart(3, "0"),
          status: data.scheduledAt ? "scheduled" : "new",
          createdAt: new Date().toISOString(),
          ...data,
        };
        return { ...d, seq, tickets: [...d.tickets, ticket] };
      });
      toast("Tiket dibuat");
    }
    setFormOpen(false);
  }

  function editActive() {
    if (!activeTicket) return;
    setDetailOpen(false);
    openForm(activeTicket);
  }

  /* ── Settings sheet ── */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sStore, setSStore] = useState(db.store);
  function openSettings() {
    setSStore(db.store);
    setSettingsOpen(true);
  }
  function saveSettings() {
    const store = sStore.trim() || "Servis";
    setDb((d) => ({ ...d, store }));
    setSettingsOpen(false);
    toast("Tersimpan");
  }

  /* ── Detail rows ── */
  const detailRows: [string, string][] = activeTicket
    ? (() => {
        const rows: [string, string][] = [
          ["Pelanggan", activeTicket.customerName || "—"],
          ["No. HP", activeTicket.phone || "—"],
          ["Harga", activeTicket.price ? fmt(activeTicket.price) : "—"],
          ["Jadwal", activeTicket.scheduledAt ? whenText(activeTicket.scheduledAt) : "—"],
          ["Dibuat", whenText(activeTicket.createdAt)],
        ];
        if (activeTicket.note) rows.push(["Catatan", activeTicket.note]);
        return rows;
      })()
    : [];

  return (
    <div data-tpl="pos-servis">
      <header className="header">
        <div className="store">{db.store}</div>
        <span className="tag">Servis</span>
        <button className="icon-btn" type="button" aria-label="Pengaturan" onClick={openSettings}>
          <GearIcon />
        </button>
      </header>

      <main className="main">
        <div className="filters">
          {FILTERS.map((f) => {
            const n = db.tickets.filter(f.match).length;
            return (
              <button
                key={f.key}
                type="button"
                aria-current={f.key === filter ? "true" : undefined}
                onClick={() => setFilter(f.key)}
              >
                {f.label} <span className="n">{n}</span>
              </button>
            );
          })}
        </div>

        <div>
          {items.length === 0 ? (
            <div className="empty">Tidak ada tiket di sini. Tap + Servis untuk buat baru.</div>
          ) : (
            items.map((t) => (
              <div
                key={t.id}
                className={"ticket" + (t.priority && t.status !== "done" && t.status !== "cancelled" ? " prio" : "")}
                onClick={() => openDetail(t)}
              >
                <div className="body">
                  <div className="code">{t.code}</div>
                  <div className="ttl">{t.title}</div>
                  <div className="cust">
                    {t.customerName || "—"}
                    {t.phone ? " · " + t.phone : ""}
                  </div>
                  <div className="foot">
                    <span className={"stag " + t.status}>{stLabel(t.status)}</span>
                    {t.price ? <span className="price">{fmt(t.price)}</span> : null}
                    {t.scheduledAt ? <span className="sched">{whenText(t.scheduledAt)}</span> : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <button className="fab" type="button" onClick={() => openForm(null)}>
        <PlusIcon />
        Servis
      </button>

      {/* New / edit ticket */}
      <BottomSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        className="bg-[var(--card)] text-[var(--ink)]"
        label="Form servis"
      >
        <div className="grabber" />
        <button className="close" type="button" aria-label="Tutup" onClick={() => setFormOpen(false)}>
          ✕
        </button>
        <div className="sin">
          <h3>{editingId ? "Ubah servis" : "Servis baru"}</h3>
          <div className="fld">
            <label>Jenis servis / pekerjaan</label>
            <input
              type="text"
              placeholder="mis. Ganti oli, Potong rambut, Cuci AC"
              value={fJob}
              onChange={(e) => setFJob(e.target.value)}
            />
          </div>
          <div className="row2">
            <div className="fld">
              <label>Nama pelanggan</label>
              <input type="text" autoComplete="name" value={fCust} onChange={(e) => setFCust(e.target.value)} />
            </div>
            <div className="fld">
              <label>No. HP</label>
              <input inputMode="tel" placeholder="0812…" value={fHp} onChange={(e) => setFHp(e.target.value)} />
            </div>
          </div>
          <div className="row2">
            <div className="fld">
              <label>Harga (Rp)</label>
              <input inputMode="numeric" placeholder="0" value={fPrice} onChange={(e) => setFPrice(e.target.value)} />
            </div>
            <div className="fld">
              <label>Jadwal (opsional)</label>
              <input type="datetime-local" value={fWhen} onChange={(e) => setFWhen(e.target.value)} />
            </div>
          </div>
          <div className="fld">
            <label>Catatan (opsional)</label>
            <textarea
              rows={2}
              placeholder="Keluhan / detail pekerjaan"
              value={fNote}
              onChange={(e) => setFNote(e.target.value)}
            />
          </div>
          <label className="check">
            <input type="checkbox" checked={fPrio} onChange={(e) => setFPrio(e.target.checked)} /> Tandai prioritas
          </label>
          <button className="save" type="button" onClick={saveForm}>
            Simpan tiket
          </button>
        </div>
      </BottomSheet>

      {/* Ticket detail */}
      <BottomSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        className="bg-[var(--card)] text-[var(--ink)]"
        label="Detail tiket"
      >
        <div className="grabber" />
        <button className="close" type="button" aria-label="Tutup" onClick={() => setDetailOpen(false)}>
          ✕
        </button>
        <div className="sin">
          <h3>{activeTicket ? activeTicket.title : "—"}</h3>
          <div className="sub">
            {activeTicket ? activeTicket.code + (activeTicket.priority ? " · Prioritas" : "") : "—"}
          </div>
          <div className="sec">Status</div>
          <div className="pipe">
            {STATUSES.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-current={activeTicket && s.key === activeTicket.status ? "true" : undefined}
                onClick={() => setStatus(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="sec">Detail</div>
          <div>
            {detailRows.map(([k, v]) => (
              <div className="detail-row" key={k}>
                <span className="k">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="detail-actions">
            <button type="button" onClick={editActive}>
              Ubah
            </button>
            <button type="button" className="del" onClick={deleteActive}>
              Hapus
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Settings */}
      <BottomSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        className="bg-[var(--card)] text-[var(--ink)]"
        label="Pengaturan"
      >
        <div className="grabber" />
        <button className="close" type="button" aria-label="Tutup" onClick={() => setSettingsOpen(false)}>
          ✕
        </button>
        <div className="sin">
          <h3>Pengaturan</h3>
          <div className="fld">
            <label>Nama usaha</label>
            <input type="text" value={sStore} onChange={(e) => setSStore(e.target.value)} />
          </div>
          <button className="save" type="button" onClick={saveSettings}>
            Simpan
          </button>
        </div>
      </BottomSheet>

      <div className={"toast" + (toastShow ? " show" : "")}>{toastMsg}</div>
    </div>
  );
}
