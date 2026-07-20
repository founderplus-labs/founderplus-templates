/** Shared formatting + small helpers used across templates. */

/** Rupiah (or given currency prefix) with id-ID grouping. */
export function formatCurrency(n: number, currency = "Rp"): string {
  return `${currency} ${Number(n || 0).toLocaleString("id-ID")}`;
}

/** Up to two-letter initials from a name — used for generated avatars. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Build a wa.me deep link with a pre-filled message. */
export function waLink(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
