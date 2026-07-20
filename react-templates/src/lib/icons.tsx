import type { SVGProps } from "react";

/**
 * Monochrome inline icons — stroked with currentColor, no third-party assets.
 * Ported 1:1 from the no-build HTML templates. `className` sets the size.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconInstagram(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTiktok(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M15 4c.4 2.4 2 4 4.5 4.2" />
      <path d="M15 4v9.5a4.5 4.5 0 1 1-4.5-4.5c.6 0 1 .1 1.5.2" />
    </svg>
  );
}

export function IconYoutube(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconX(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

export function IconWeb(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}

export function IconEmail(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function IconCart(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L22 7H6" />
    </svg>
  );
}

export function IconWhatsapp(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z" />
      <path
        d="M8.5 9c0 3.5 3 6.5 6.5 6.5.6 0 1-.5 1-.9l-.2-1.4a.8.8 0 0 0-.6-.6l-1.3-.3a.8.8 0 0 0-.7.2l-.4.4a5 5 0 0 1-2-2l.4-.4a.8.8 0 0 0 .2-.7l-.3-1.3a.8.8 0 0 0-.6-.6L9.4 8c-.4 0-.9.4-.9 1z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function IconArrowUpRight(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function IconVerified(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path
        d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.7-.9 2.9.9 2.9-2.4 1.7-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15l.9-2.9L3.2 9.2l2.4-1.7 1-2.8 3-.1z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" stroke="var(--color-bg-verified, #0b0b0e)" strokeWidth={2} />
    </svg>
  );
}

/** Map a social `type` string to its icon component. */
export const SOCIAL_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  ig: IconInstagram,
  tiktok: IconTiktok,
  youtube: IconYoutube,
  x: IconX,
  web: IconWeb,
  email: IconEmail,
};
