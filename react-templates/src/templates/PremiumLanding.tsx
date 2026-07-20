import { useEffect, useState } from "react";
import { Reveal, useRevealRef } from "../lib/reveal.tsx";
import { useFounderplusTracker } from "../lib/founderplus.ts";

/* ─── Config: swap copy, colours (via --color-accent token), links. ─── */
const NAV = [
  { href: "#fitur", label: "Fitur" },
  { href: "#angka", label: "Angka" },
  { href: "#harga", label: "Harga" },
  { href: "#kontak", label: "Kontak" },
];
const FP_PROJECT_ID = ""; // isi untuk analytics Founder+; kosong = mati.

/* ─── Buttons ─── */
const btnBase =
  "inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold transition-[transform,background] duration-150 ease-out-quint active:scale-[0.97] motion-reduce:active:scale-100";
const btn = {
  primary: `${btnBase} bg-[#f4f4f6] text-[#0b0b0d] hover:bg-white`,
  ghost: `${btnBase} bg-white/[0.07] text-[#f4f4f6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] hover:bg-white/[0.12]`,
  accent: `${btnBase} bg-accent text-white hover:bg-[color-mix(in_srgb,var(--color-accent)_84%,#fff)]`,
};

/* ─── Inline icons ─── */
const ico = "size-5 [stroke-linecap:round] [stroke-linejoin:round]";
function Spark({ className = "size-[15px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5z" strokeLinejoin="round" />
    </svg>
  );
}
function Check({ className = "size-[14px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={className}>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FEATURES = [
  {
    title: "Tanpa build",
    body: "Satu komponen React. Edit, jalankan, publish. Struktur rapi yang gampang kamu ubah.",
    path: <path d="M4 7h16M4 12h10M4 17h7" strokeWidth={1.7} fill="none" stroke="currentColor" strokeLinecap="round" />,
  },
  {
    title: "Cepat & ringan",
    body: "Tanpa dependensi berat. Aset dibuat dengan CSS, jadi loading instan.",
    path: (
      <>
        <circle cx="12" cy="12" r="9" strokeWidth={1.7} fill="none" stroke="currentColor" />
        <path d="M12 7v5l3 2" strokeWidth={1.7} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Milik kamu",
    body: "Host di domainmu sendiri. Ganti warna brand lewat satu token, selesai.",
    path: <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" strokeWidth={1.7} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

const STATS = [
  { count: 99, suffix: "%", label: "Skor performa halaman" },
  { count: 1, suffix: " file", label: "Yang perlu kamu publish" },
  { count: 0, prefix: "$", label: "Biaya server bulanan" },
];

function Stat({ count, prefix = "", suffix = "", label }: { count: number; prefix?: string; suffix?: string; label: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRevealRef(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || count === 0) {
      setDisplay(count);
      return;
    }
    const dur = 1200;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setDisplay(count * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
      else setDisplay(count);
    };
    requestAnimationFrame(tick);
  });
  return (
    <div ref={ref} className="text-center">
      <div className="text-[clamp(44px,7vw,68px)] font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {prefix}
        {Math.round(display).toLocaleString("id-ID")}
        {suffix}
      </div>
      <div className="mt-3 text-[15px] text-[#a2a2ad]">{label}</div>
    </div>
  );
}

const PLANS = [
  {
    kind: "a" as const,
    amount: "Rp 0",
    per: "/ selamanya",
    desc: "Untuk mulai. Semua dasar yang kamu perlukan untuk meluncurkan.",
    features: [
      { label: "Template landing lengkap", dim: false },
      { label: "Animasi & komponen dasar", dim: false },
      { label: "Host di mana saja", dim: false },
      { label: "Dukungan prioritas", dim: true },
    ],
    cta: "Mulai",
  },
  {
    kind: "b" as const,
    amount: "Rp 149rb",
    per: "/ bulan",
    desc: "Untuk yang mau lebih. Komponen & dukungan tambahan.",
    features: [
      { label: "Semua di paket gratis", dim: false },
      { label: "Komponen pro", dim: false },
      { label: "Integrasi lanjutan", dim: false },
      { label: "Dukungan prioritas", dim: false },
    ],
    cta: "Hubungi kami",
  },
];

function Brand() {
  return (
    <span className="inline-flex items-center gap-2.5 text-base font-bold tracking-[-0.01em]">
      <span className="grid size-[26px] place-items-center rounded-lg bg-gradient-to-br from-accent to-brand-6 text-white">
        <Spark />
      </span>
      Template
    </span>
  );
}

export function PremiumLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  useFounderplusTracker(FP_PROJECT_ID);
  useEffect(() => {
    document.title = "Template Premium — Selamat datang";
  }, []);
  const year = new Date().getFullYear();

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0a0a0c] text-[#f4f4f6] [scroll-behavior:smooth] motion-reduce:[scroll-behavior:auto]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[color-mix(in_srgb,#0a0a0c_72%,transparent)] py-3.5 backdrop-blur-[16px] backdrop-saturate-150">
        <div className="mx-auto flex max-w-[1140px] items-center gap-[22px] px-5">
          <a href="/" className="animate-rise">
            <Brand />
          </a>
          <nav className="ml-[26px] hidden gap-[26px] md:flex">
            {NAV.map((n, i) => (
              <a
                key={n.href}
                href={n.href}
                className="animate-rise text-[14.5px] text-[#a2a2ad] transition-colors duration-150 ease-out-quint hover:text-[#f4f4f6]"
                style={{ animationDelay: `${0.12 + i * 0.05}s` }}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <button type="button" className={`${btn.primary} hidden animate-rise md:inline-flex`} style={{ animationDelay: ".32s" }}>
              Mulai gratis
            </button>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
              className="grid gap-[5px] p-2 md:hidden"
            >
              <span className="h-0.5 w-[22px] rounded bg-[#f4f4f6]" />
              <span className="h-0.5 w-[22px] rounded bg-[#f4f4f6]" />
              <span className="h-0.5 w-[22px] rounded bg-[#f4f4f6]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-60 flex flex-col bg-[#0a0a0c] p-[22px]">
          <div className="flex items-center justify-between">
            <Brand />
            <button type="button" aria-label="Tutup" onClick={() => setMenuOpen(false)} className="text-3xl leading-none">
              ×
            </button>
          </div>
          <nav className="mt-8 flex flex-col gap-1" onClick={() => setMenuOpen(false)}>
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="border-b border-white/[0.06] py-3 text-[26px] font-semibold">
                {n.label}
              </a>
            ))}
          </nav>
          <button type="button" className={`${btn.primary} mt-auto`}>
            Mulai gratis
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="relative mx-auto max-w-[1140px] px-5 pt-[84px] pb-10 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute top-[-10%] left-1/2 -z-0 h-[520px] w-[720px] max-w-[120vw] -translate-x-1/2 opacity-80 blur-[30px]"
          style={{ background: "radial-gradient(50% 50% at 50% 40%, color-mix(in srgb, var(--color-accent) 26%, transparent), transparent 70%)" }}
        />
        <div className="relative z-10">
          <span
            className="inline-flex animate-rise items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] px-3 py-1.5 text-[12.5px] font-semibold tracking-[0.02em] text-accent-soft"
            style={{ animationDelay: ".1s" }}
          >
            <Spark className="size-3.5" /> Selamat datang di template kami
          </span>
          <h1 className="mx-auto mt-[22px] max-w-[15ch] animate-rise text-[clamp(38px,8vw,76px)] font-semibold leading-[1.03] tracking-[-0.03em]" style={{ animationDelay: ".2s" }}>
            Cara elegan meluncurkan produkmu
          </h1>
          <p className="mx-auto mt-5 max-w-[56ch] animate-rise text-[clamp(16px,2.2vw,21px)] text-[#a2a2ad]" style={{ animationDelay: ".34s" }}>
            Landing page gelap yang cepat dan premium. Ganti teks, warna, dan tautan — lalu publish. Tanpa server.
          </p>
          <div className="mt-[30px] flex animate-rise flex-wrap justify-center gap-3" style={{ animationDelay: ".46s" }}>
            <button type="button" className={btn.accent}>Mulai sekarang</button>
            <button type="button" className={btn.ghost}>Lihat demo</button>
          </div>
          <div className="mt-4 animate-rise text-[13px] text-[#6c6c78]" style={{ animationDelay: ".56s" }}>
            Gratis dipakai · siap kamu host sendiri
          </div>

          {/* Product mock — pure CSS, no external image */}
          <div
            aria-hidden
            className="mx-auto mt-[54px] max-w-[1000px] animate-rise overflow-hidden rounded-[22px] bg-[#131317] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.09)]"
            style={{ animationDelay: ".7s" }}
          >
            <div className="flex items-center gap-3.5 border-b border-white/[0.06] px-[18px] py-3.5">
              <div className="flex gap-[7px]">
                {[0, 1, 2].map((i) => (
                  <i key={i} className="size-[11px] rounded-full bg-[#3a3a42]" />
                ))}
              </div>
              <div className="ml-auto flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <i key={i} className="size-[30px] rounded-lg bg-white/[0.05] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
                ))}
              </div>
            </div>
            <div className="grid min-h-[300px] grid-cols-1 sm:grid-cols-[200px_1fr]">
              <div className="flex gap-2.5 overflow-auto border-b border-white/[0.06] p-4 sm:flex-col sm:border-r sm:border-b-0">
                <div className="h-[38px] min-w-[90px] flex-none rounded-[10px] bg-[color-mix(in_srgb,var(--color-accent)_20%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-accent)_40%,transparent)] sm:min-w-0" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[38px] min-w-[90px] flex-none rounded-[10px] bg-white/[0.035] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] sm:min-w-0" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3.5 p-[18px] [grid-auto-rows:116px]">
                <div className="rounded-[14px] bg-gradient-to-br from-[#d7d0c0] to-[#bcb4a0]" />
                <div className="rounded-[14px]" style={{ background: "radial-gradient(120% 120% at 0% 0%, color-mix(in srgb, var(--color-accent) 40%, transparent), #17171c 60%)" }} />
                <div className="rounded-[14px] bg-gradient-to-br from-[#232329] to-[#17171c] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
                <div className="col-span-2 rounded-[14px] bg-gradient-to-br from-[#1c1c22] to-[#141418] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="fitur" className="mx-auto max-w-[1140px] px-5 py-24">
        <div className="mb-11 flex flex-wrap items-end justify-between gap-5">
          <div>
            <Reveal as="span" className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] px-3 py-1.5 text-[12.5px] font-semibold text-accent-soft">
              Fitur
            </Reveal>
            <Reveal as="h2" delay={0.08} className="mt-3 max-w-[20ch] text-[clamp(28px,4.5vw,44px)] font-semibold tracking-[-0.02em]">
              Semua yang kamu butuh untuk tampil serius
            </Reveal>
          </div>
          <Reveal as="p" delay={0.16} className="max-w-[42ch] text-base text-[#a2a2ad]">
            Komponen rapi, animasi halus, dan struktur yang gampang kamu ubah. Ganti isi, biarkan desainnya bekerja.
          </Reveal>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08} className="rounded-[20px] bg-[#131317] p-[26px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]">
              <div className="mb-[18px] grid size-11 place-items-center rounded-xl bg-white/[0.05] text-[#f4f4f6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]">
                <svg viewBox="0 0 24 24" className={ico}>{f.path}</svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold tracking-[-0.01em]">{f.title}</h3>
              <p className="text-[14.5px] text-[#a2a2ad]">{f.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section id="angka" className="mx-auto max-w-[1140px] px-5 py-24">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[22px]">
          {STATS.map((s) => (
            <Reveal key={s.label}>
              <Stat {...s} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="mx-auto max-w-[1140px] px-5 py-24">
        <Reveal className="rounded-[28px] bg-[#d7d0c0] p-[clamp(28px,5vw,72px)] text-[#16130f]">
          <h2 className="mb-3 text-center text-[clamp(30px,5vw,52px)] font-semibold tracking-[-0.02em]">Harga sederhana</h2>
          <p className="mx-auto mb-12 max-w-[46ch] text-center text-[#16130f]/60">Contoh struktur harga. Ganti angka & benefit sesuai produkmu.</p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-7">
            {PLANS.map((p) => (
              <div key={p.kind} className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-[40px] font-semibold tracking-[-0.02em]">{p.amount}</span>
                  <span className="text-lg text-[#16130f]/50">{p.per}</span>
                </div>
                <p className="mt-4 text-[15px] text-[#16130f]/80">{p.desc}</p>
                <hr className="my-6 border-t border-black/[0.12]" />
                <ul className="flex flex-1 flex-col gap-3.5">
                  {p.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-3 text-[15px]">
                      <span className={`grid size-[22px] flex-none place-items-center rounded-full bg-[#16130f] text-[#d7d0c0] ${f.dim ? "opacity-25" : ""}`}>
                        <Check />
                      </span>
                      {f.label}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`${btnBase} mt-7 w-full justify-center ${
                    p.kind === "a" ? "bg-[#16130f] text-[#d7d0c0]" : "bg-transparent text-[#16130f] shadow-[inset_0_0_0_1px_rgba(22,19,15,0.4)]"
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA band */}
      <section id="kontak" className="mx-auto max-w-[1140px] px-5 py-24 text-center">
        <Reveal className="relative overflow-hidden rounded-[28px] bg-[#131317] p-[clamp(36px,6vw,84px)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]">
          <div
            aria-hidden
            className="absolute inset-x-[20%] top-[-40%] h-[300px] blur-[30px]"
            style={{ background: "radial-gradient(50% 100% at 50% 0%, color-mix(in srgb, var(--color-accent) 40%, transparent), transparent 70%)" }}
          />
          <h2 className="relative mx-auto max-w-[18ch] text-[clamp(30px,5vw,52px)] font-semibold tracking-[-0.02em]">Siap meluncurkan?</h2>
          <p className="relative mx-auto mt-[18px] mb-[30px] max-w-[46ch] text-[#a2a2ad]">
            Ganti teks di komponen ini, sesuaikan warna, lalu publish ke domainmu. Semudah itu.
          </p>
          <div className="relative flex flex-wrap justify-center gap-3">
            <button type="button" className={btn.accent}>Mulai gratis</button>
            <button type="button" className={btn.ghost}>Pelajari dulu</button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] pt-16 pb-10">
        <div className="mx-auto max-w-[1140px] px-5">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-[2fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
              <Brand />
              <p className="mt-4 max-w-[38ch] text-[14.5px] text-[#a2a2ad]">
                Template landing premium, self-contained. Ganti isinya, jadikan milikmu.
              </p>
            </div>
            <div>
              <h4 className="mb-3.5 text-[13px] font-normal tracking-[0.06em] text-[#6c6c78] uppercase">Produk</h4>
              {["Fitur", "Harga", "Angka"].map((l) => (
                <a key={l} href="#fitur" className="block py-1.5 text-[14.5px] text-[#a2a2ad] transition-colors hover:text-[#f4f4f6]">
                  {l}
                </a>
              ))}
            </div>
            <div>
              <h4 className="mb-3.5 text-[13px] font-normal tracking-[0.06em] text-[#6c6c78] uppercase">Perusahaan</h4>
              {["Tentang", "Kontak", "Kebijakan privasi"].map((l) => (
                <a key={l} href="#" className="block py-1.5 text-[14.5px] text-[#a2a2ad] transition-colors hover:text-[#f4f4f6]">
                  {l}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-[13px] text-[#6c6c78]">
            <span>© {year} Template kamu. Semua hak dilindungi.</span>
            <span>Dibuat dengan template Founder+</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
