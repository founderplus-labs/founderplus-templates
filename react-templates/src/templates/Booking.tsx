import { useEffect, useMemo, useState } from "react";
import { useFounderplusTracker } from "../lib/founderplus.ts";
import { IconWhatsapp } from "../lib/icons.tsx";
import "./booking.css";

/* ══════════════════════════ BUSINESS ══════════════════════════ */
const BUSINESS = {
  name: "Usaha Kamu",
  whatsapp: "6281234567890", // WA penerima booking, format 62…
  currency: "IDR",
  founderplus: { projectId: "" }, // GTM opsional (spec-driven)
};

// Jam operasional + panjang slot (menit). closedDays: 0=Min … 6=Sab.
const HOURS = { open: "09:00", close: "17:00", slotMinutes: 60, closedDays: [0] };

/* ══════════════════════════ SERVICES ══════════════════════════ */
interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}
const SERVICES: Service[] = [
  { id: "potong", name: "Potong rambut", duration: 45, price: 50000 },
  { id: "cuci-blow", name: "Cuci + blow", duration: 60, price: 75000 },
  { id: "cat", name: "Cat rambut", duration: 120, price: 250000 },
  { id: "creambath", name: "Creambath", duration: 60, price: 90000 },
];
/* ═════════════════════════════════════════════════════════════ */

const fmt = (n: number) =>
  BUSINESS.currency === "IDR" ? "Rp " + Number(n || 0).toLocaleString("id-ID") : Number(n || 0).toLocaleString();
const pad = (n: number) => String(n).padStart(2, "0");
const toInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Next date (from today) that isn't a closed day. */
function nextOpenDate(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 8 && HOURS.closedDays.includes(d.getDay()); i++) d.setDate(d.getDate() + 1);
  return toInput(d);
}

/** Time slots for a date — skips past slots today, empty on closed days. */
function slotsFor(dateStr: string): string[] {
  if (!dateStr) return [];
  const d = new Date(dateStr + "T00:00:00");
  if (HOURS.closedDays.includes(d.getDay())) return [];
  const [oh, om] = HOURS.open.split(":").map(Number);
  const [ch, cm] = HOURS.close.split(":").map(Number);
  const start = oh * 60 + om;
  const end = ch * 60 + cm;
  const now = new Date();
  const isToday = toInput(now) === dateStr;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const out: string[] = [];
  for (let t = start; t <= end - HOURS.slotMinutes; t += HOURS.slotMinutes) {
    if (isToday && t <= nowMin) continue;
    out.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return out;
}

const stepLabel = "mb-3 flex items-center gap-[9px] text-[12.5px] font-bold tracking-[0.05em] text-[var(--k-muted)] uppercase";
const stepNum = "grid size-5 place-items-center rounded-full bg-[var(--k-ink)] text-[11px] text-[var(--k-bg)]";
const field =
  "w-full rounded-xl bg-[var(--k-card)] px-3.5 py-[13px] text-[var(--k-ink)] shadow-[inset_0_0_0_1px_var(--k-line)] outline-none focus:shadow-[inset_0_0_0_2px_var(--k-accent)]";

export function Booking() {
  const [selService, setSelService] = useState<string | null>(null);
  const [selDate, setSelDate] = useState<string>(nextOpenDate);
  const [selSlot, setSelSlot] = useState<string>("");
  const [nama, setNama] = useState("");
  const [hp, setHp] = useState("");
  const [note, setNote] = useState("");

  useFounderplusTracker(BUSINESS.founderplus.projectId);
  useEffect(() => {
    document.title = `${BUSINESS.name} — Booking`;
  }, []);

  const todayMin = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return toInput(t);
  }, []);
  const slots = useMemo(() => slotsFor(selDate), [selDate]);
  const closedToday = useMemo(() => {
    if (!selDate) return false;
    return HOURS.closedDays.includes(new Date(selDate + "T00:00:00").getDay());
  }, [selDate]);

  const svc = SERVICES.find((s) => s.id === selService);
  const ready = Boolean(selService && selDate && selSlot && nama.trim());

  const summary =
    svc && selDate && selSlot ? (
      <>
        <b className="font-semibold text-[var(--k-ink)]">{svc.name}</b> ·{" "}
        {new Date(selDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })},{" "}
        {selSlot} · {fmt(svc.price)}
      </>
    ) : (
      "Pilih layanan & jadwal untuk mulai."
    );

  const confirm = () => {
    if (!ready || !svc) return;
    const day = new Date(selDate + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const text =
      `Halo ${BUSINESS.name}! Mau booking:\n` +
      `Layanan: ${svc.name} (${svc.duration} menit · ${fmt(svc.price)})\n` +
      `Jadwal: ${day}, ${selSlot}\n` +
      `Nama: ${nama.trim()}` +
      (hp.trim() ? `\nWA: ${hp.trim()}` : "") +
      (note.trim() ? `\nCatatan: ${note.trim()}` : "");
    location.href = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div data-tpl="booking" className="min-h-dvh bg-[var(--k-bg)] pb-24 text-[var(--k-ink)] antialiased">
      <header className="sticky top-0 z-10 border-b border-[var(--k-line)] bg-[color-mix(in_srgb,var(--k-bg)_82%,transparent)] pt-4 pb-3.5 backdrop-blur-[16px] backdrop-saturate-150">
        <div className="mx-auto flex max-w-[560px] items-center gap-2.5 px-4">
          <div className="flex-1 text-lg font-bold tracking-[-0.02em]">{BUSINESS.name}</div>
          <span className="rounded-full bg-[color-mix(in_srgb,var(--k-accent)_14%,transparent)] px-[9px] py-[3px] text-[11px] font-bold tracking-[0.04em] text-[var(--k-accent-ink)] uppercase">
            Booking
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-4">
        {/* 1 — service */}
        <div className="mt-[26px]">
          <div className={stepLabel}>
            <span className={stepNum}>1</span> Pilih layanan
          </div>
          <div className="flex flex-col gap-2.5">
            {SERVICES.map((s) => {
              const active = selService === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-current={active}
                  onClick={() => setSelService(s.id)}
                  className={[
                    "flex w-full items-center gap-3.5 rounded-2xl bg-[var(--k-card)] p-[15px] text-left text-[var(--k-ink)] transition-[box-shadow,transform] duration-150 ease-out-quint active:scale-[0.99]",
                    active ? "shadow-[inset_0_0_0_2px_var(--k-accent)]" : "shadow-[inset_0_0_0_1px_var(--k-line)]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid size-[22px] flex-none place-items-center rounded-full",
                      active ? "bg-[var(--k-accent)] text-white" : "text-transparent shadow-[inset_0_0_0_2px_var(--k-line)]",
                    ].join(" ")}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="size-[13px]">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15.5px] font-semibold tracking-[-0.01em]">{s.name}</span>
                    <span className="mt-0.5 block text-[12.5px] text-[var(--k-muted)]">{s.duration} menit</span>
                  </span>
                  <span className="font-bold tracking-[-0.01em] tabular-nums">{fmt(s.price)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2 — date + time */}
        <div className="mt-[26px]">
          <div className={stepLabel}>
            <span className={stepNum}>2</span> Pilih tanggal & jam
          </div>
          <input
            type="date"
            value={selDate}
            min={todayMin}
            onChange={(e) => {
              setSelDate(e.target.value);
              setSelSlot("");
            }}
            className={field}
          />
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-[9px]">
            {closedToday ? (
              <div className="col-span-full px-0.5 py-2 text-[13.5px] text-[var(--k-muted)]">Tutup di hari ini. Pilih tanggal lain.</div>
            ) : slots.length === 0 ? (
              <div className="col-span-full px-0.5 py-2 text-[13.5px] text-[var(--k-muted)]">Tak ada slot tersisa hari ini. Pilih tanggal lain.</div>
            ) : (
              slots.map((label) => {
                const active = selSlot === label;
                return (
                  <button
                    key={label}
                    type="button"
                    aria-current={active}
                    onClick={() => setSelSlot(label)}
                    className={[
                      "rounded-[11px] px-1.5 py-[11px] text-sm font-semibold tabular-nums transition-all duration-150 ease-out-quint active:scale-95",
                      active ? "bg-[var(--k-ink)] text-[var(--k-bg)]" : "bg-[var(--k-card)] text-[var(--k-ink)] shadow-[inset_0_0_0_1px_var(--k-line)]",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 3 — details */}
        <div className="mt-[26px]">
          <div className={stepLabel}>
            <span className={stepNum}>3</span> Data kamu
          </div>
          <div className="mt-2.5">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--k-secondary)]">Nama</label>
            <input type="text" autoComplete="name" value={nama} onChange={(e) => setNama(e.target.value)} className={field} />
          </div>
          <div className="mt-2.5">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--k-secondary)]">No. WhatsApp</label>
            <input inputMode="tel" placeholder="0812…" value={hp} onChange={(e) => setHp(e.target.value)} className={field} />
          </div>
          <div className="mt-2.5">
            <label className="mb-1.5 block text-[12.5px] font-semibold text-[var(--k-secondary)]">Catatan (opsional)</label>
            <input type="text" placeholder="Permintaan khusus" value={note} onChange={(e) => setNote(e.target.value)} className={field} />
          </div>
        </div>

        <footer className="py-6 text-center text-[12.5px] text-[var(--k-muted)]">
          Ditenagai{" "}
          <a href="https://founderplus.id" target="_blank" rel="noopener" className="text-[var(--k-accent-ink)] no-underline">
            Founder+
          </a>
        </footer>
      </main>

      {/* Sticky confirm bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--k-line)] bg-[color-mix(in_srgb,var(--k-bg)_84%,transparent)] px-4 py-3 backdrop-blur-[16px] backdrop-saturate-150">
        <div className="mx-auto max-w-[560px]">
          <div className="mb-[9px] min-h-[18px] text-[13px] text-[var(--k-muted)]">{summary}</div>
          <button
            type="button"
            onClick={confirm}
            disabled={!ready}
            className="inline-flex w-full items-center justify-center gap-[9px] rounded-2xl bg-[var(--k-ok)] p-[15px] text-base font-bold text-white transition-[transform,opacity] duration-150 ease-out-quint active:scale-[0.985] disabled:opacity-45"
          >
            <IconWhatsapp className="size-[18px]" />
            Booking via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
