import { useEffect } from "react";

/** Founder+ hosted checkout base. Transactions are processed by Founder+. */
export const CHECKOUT_BASE = "https://academy.founderplus.id/checkout";

export interface CheckoutProduct {
  productSlug?: string;
  productType?: string;
}

/** Build a Founder+ checkout URL for a product link. */
export function checkoutUrl({ productSlug, productType }: CheckoutProduct): string {
  const q = new URLSearchParams({
    slug: productSlug || "",
    type: productType || "customProduct",
  });
  return `${CHECKOUT_BASE}?${q}`;
}

/**
 * Spec-driven Founder+ analytics (GTM / funnel-tracker).
 * Injects cdn.founderplus.id/funnel-tracker.js only when a projectId is set.
 * Empty projectId = no external call at all.
 */
export function useFounderplusTracker(projectId?: string): void {
  useEffect(() => {
    if (!projectId) return;
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-fp-tracker]",
    );
    if (existing) return;
    const s = document.createElement("script");
    s.src = "https://cdn.founderplus.id/funnel-tracker.js";
    s.setAttribute("data-project-id", projectId);
    s.setAttribute("data-fp-tracker", "");
    s.defer = true;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, [projectId]);
}
