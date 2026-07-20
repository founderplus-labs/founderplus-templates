import { useEffect } from "react";
import { formatCurrency, initials, waLink } from "../lib/format.ts";
import { checkoutUrl, useFounderplusTracker } from "../lib/founderplus.ts";
import {
  IconArrowUpRight,
  IconCart,
  IconVerified,
  IconWhatsapp,
  SOCIAL_ICONS,
  IconWeb,
} from "../lib/icons.tsx";

/* ══════════════════════════ PROFILE ══════════════════════════ */
const PROFILE = {
  name: "Namamu",
  handle: "@namamu",
  bio: "Kreator · bikin sesuatu yang berguna. Semua tautanku di sini.",
  photo: "", // (opsional) URL foto profil. Kosong = inisial di gradient.
  verified: true,
  whatsapp: "6281234567890",
  // type = ig | tiktok | youtube | x | web | email
  socials: [
    { type: "ig", url: "https://instagram.com/namamu" },
    { type: "tiktok", url: "https://tiktok.com/@namamu" },
    { type: "youtube", url: "https://youtube.com/@namamu" },
    { type: "web", url: "https://situsmu.com" },
  ],
  // Integrasi Founder+ (spec-driven) — GTM opsional. Kosong = off.
  founderplus: { projectId: "" },
};

/* ══════════════════════════ LINKS ══════════════════════════ */
type Link =
  | { type: "product"; title: string; sub?: string; feature?: boolean; productSlug: string; productType: string; price?: number }
  | { type: "whatsapp"; title: string; sub?: string; feature?: boolean }
  | { type: "link"; title: string; sub?: string; feature?: boolean; url: string };

const LINKS: Link[] = [
  {
    type: "product",
    feature: true,
    title: "Beli e-book ku",
    sub: "Panduan lengkap, akses instan",
    productSlug: "GANTI-SLUG-PRODUK",
    productType: "customProduct",
    price: 99000,
  },
  { type: "whatsapp", title: "Chat / kerja sama", sub: "Balas cepat di jam kerja" },
  { type: "link", title: "Portofolio terbaru", sub: "situsmu.com/karya", url: "https://situsmu.com/karya" },
  { type: "link", title: "Newsletter mingguan", sub: "Tips tiap Jumat", url: "https://situsmu.com/newsletter" },
];
/* ═════════════════════════════════════════════════════════════ */

function hrefFor(lk: Link): string {
  if (lk.type === "whatsapp") {
    return waLink(PROFILE.whatsapp, `Halo ${PROFILE.name}, saya lihat link bio-mu.`);
  }
  if (lk.type === "product") return checkoutUrl(lk);
  return lk.url || "#";
}

function LinkRow({ lk, index }: { lk: Link; index: number }) {
  const feature = lk.feature ?? false;
  const external = lk.type !== "link" || /^https?:/.test((lk as { url?: string }).url || "");
  const Icon = lk.type === "product" ? IconCart : lk.type === "whatsapp" ? IconWhatsapp : IconArrowUpRight;
  const price = lk.type === "product" ? lk.price : undefined;

  return (
    <a
      href={hrefFor(lk)}
      target={external ? "_blank" : undefined}
      rel="noopener"
      style={{ animationDelay: `${0.3 + index * 0.06}s` }}
      className={[
        "group flex animate-rise items-center gap-3.5 rounded-2xl p-[15px_16px] text-left transition-[transform,background] duration-150 ease-out-quint active:scale-[0.985]",
        feature
          ? "bg-accent text-white hover:bg-[color-mix(in_srgb,var(--color-accent)_88%,#fff)]"
          : "bg-[#16161c] text-[#f3f3f6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] hover:bg-[#1c1c23]",
      ].join(" ")}
    >
      <span
        className={[
          "grid size-10 flex-none place-items-center rounded-[11px]",
          feature ? "bg-white/[0.18] text-white" : "bg-white/[0.05] text-[#f3f3f6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]",
        ].join(" ")}
      >
        <Icon className="size-[19px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-semibold tracking-[-0.01em]">{lk.title}</span>
        {lk.sub && (
          <span className={["block truncate text-[12.5px]", feature ? "text-white/80" : "text-[#a0a0ac]"].join(" ")}>
            {lk.sub}
          </span>
        )}
      </span>
      <span className={["flex flex-none items-center gap-2 text-[13px] font-semibold", feature ? "text-white" : "text-[#c4b5fd]"].join(" ")}>
        {price ? (
          <span
            className={[
              "rounded-full px-[9px] py-[3px] tabular-nums",
              feature ? "bg-white/[0.16]" : "bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)]",
            ].join(" ")}
          >
            {formatCurrency(price)}
          </span>
        ) : (
          <IconArrowUpRight className={["size-4", feature ? "text-white" : "text-[#6a6a76]"].join(" ")} />
        )}
      </span>
    </a>
  );
}

export function LinkInBio() {
  useFounderplusTracker(PROFILE.founderplus.projectId);
  useEffect(() => {
    document.title = `${PROFILE.name} — Link in bio`;
  }, []);

  return (
    <div
      className="min-h-dvh px-[18px] py-10 text-[#f3f3f6]"
      style={{
        background:
          "radial-gradient(60% 40% at 50% 0%, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 70%), #0b0b0e",
        // makes the verified checkmark cutout match the bg
        // @ts-expect-error custom prop
        "--color-bg-verified": "#0b0b0e",
      }}
    >
      <main className="mx-auto max-w-[480px] text-center">
        {/* avatar */}
        <div
          className="relative mx-auto mb-[18px] grid size-24 animate-pop place-items-center rounded-full text-[34px] font-bold tracking-[-0.02em] text-white"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 45%, #f97316))",
            boxShadow: "0 10px 40px -12px color-mix(in srgb, var(--color-accent) 60%, transparent), inset 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          {PROFILE.photo ? (
            <img src={PROFILE.photo} alt={PROFILE.name} className="absolute inset-0 size-full rounded-full object-cover" />
          ) : (
            initials(PROFILE.name)
          )}
        </div>

        <div className="flex animate-rise items-center justify-center gap-[7px] text-[22px] font-bold tracking-[-0.02em]" style={{ animationDelay: ".08s" }}>
          <span>{PROFILE.name}</span>
          {PROFILE.verified && <IconVerified className="size-[18px] text-[#c4b5fd]" />}
        </div>
        <div className="mt-[3px] animate-rise text-sm font-semibold text-[#c4b5fd]" style={{ animationDelay: ".12s" }}>
          {PROFILE.handle}
        </div>
        <p className="mx-auto mt-3 max-w-[34ch] animate-rise text-[14.5px] text-[#a0a0ac]" style={{ animationDelay: ".18s" }}>
          {PROFILE.bio}
        </p>

        {/* socials */}
        <div className="my-[22px_0_26px] flex animate-rise justify-center gap-2.5" style={{ animationDelay: ".24s" }}>
          {PROFILE.socials.map((s) => {
            const Icon = SOCIAL_ICONS[s.type] ?? IconWeb;
            return (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener"
                aria-label={s.type}
                className="grid size-[42px] place-items-center rounded-xl bg-[#16161c] text-[#f3f3f6] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] transition-[transform,background] duration-150 ease-out-quint hover:bg-[#1c1c23] active:scale-[0.92]"
              >
                <Icon className="size-[19px]" />
              </a>
            );
          })}
        </div>

        {/* links */}
        <div className="flex flex-col gap-3">
          {LINKS.map((lk, i) => (
            <LinkRow key={lk.title} lk={lk} index={i} />
          ))}
        </div>

        <footer className="mt-[30px] animate-rise text-xs text-[#6a6a76]" style={{ animationDelay: ".6s" }}>
          Dibuat dengan{" "}
          <a href="https://founderplus.id" target="_blank" rel="noopener" className="text-[#a0a0ac] no-underline">
            Founder+
          </a>
        </footer>
      </main>
    </div>
  );
}
