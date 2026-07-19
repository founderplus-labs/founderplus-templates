// Progress math (spec 0010). Pure functions — the numeric heart of OKR.
import type { Target } from "./types.ts";

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * Progress of one target as an integer 0..100.
 *
 * Works for both directions:
 *  - up:   from < to  (e.g. 0 → 100)
 *  - down: from > to  (e.g. 20 → 5, "reduce churn")
 *
 * Out-of-range `current` is clamped to [0,100]. When `from === to` there is no
 * range to measure against, so we treat "reached" (current >= to) as 100 else 0
 * — never divide by zero.
 */
export function computeTargetProgress(
  from: number,
  to: number,
  current: number,
): number {
  if (from === to) return current >= to ? 100 : 0;
  const ratio = (current - from) / (to - from);
  return Math.round(clamp01(ratio) * 100);
}

/** Convenience: progress for a Target record. */
export function targetProgress(t: Target): number {
  return computeTargetProgress(t.fromValue, t.toValue, t.currentValue);
}

/**
 * Rollup progress of a goal from its targets (spec 0010), integer 0..100.
 * Returns `null` when there are no targets — "unmeasured", NOT a misleading 0%.
 * Weighted by each target's `weight` (default 1).
 */
export function computeGoalProgress(targets: Target[]): number | null {
  if (targets.length === 0) return null;
  let weighted = 0;
  let totalWeight = 0;
  for (const t of targets) {
    const w = t.weight ?? 1;
    weighted += targetProgress(t) * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return null;
  return Math.round(weighted / totalWeight);
}
