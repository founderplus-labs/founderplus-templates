// Progress math (spec 0010) — mirrors Operately Goals.Target helpers
// (target_progress_percentage/1, done?/1, format_value/1).
import type { Target } from "./types.ts";

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Progress of one target as an integer 0..100. Works for both directions
 * (from<to "increase", from>to "reduce"). Out-of-range is clamped. When
 * from===to there is no range — reached (value>=to) is 100, else 0. No div0.
 */
export function computeTargetProgress(from: number, to: number, value: number): number {
  if (from === to) return value >= to ? 100 : 0;
  return Math.round(clamp01((value - from) / (to - from)) * 100);
}

export function targetProgressPercentage(t: Target): number {
  return computeTargetProgress(t.from, t.to, t.value);
}

/** Operately Target.done?/1 — has the target reached its goal value. */
export function isTargetDone(t: Target): boolean {
  return targetProgressPercentage(t) >= 100;
}

/** Operately Target.format_value/1 — format value according to its unit. */
export function formatTargetValue(unit: string, value: number): string {
  switch (unit) {
    case "percent":
      return `${value}%`;
    case "currency":
      return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
    case "boolean":
      return value >= 1 ? "Yes" : "No";
    default:
      return `${value}`;
  }
}

/**
 * Rollup progress of a goal from its targets (integer 0..100), weighted by each
 * target's `weight` (default 1). Returns `null` when there are no targets —
 * "unmeasured", never a misleading 0%.
 */
export function computeGoalProgress(targets: Target[]): number | null {
  if (targets.length === 0) return null;
  let weighted = 0;
  let totalWeight = 0;
  for (const t of targets) {
    const w = t.weight ?? 1;
    weighted += targetProgressPercentage(t) * w;
    totalWeight += w;
  }
  return totalWeight === 0 ? null : Math.round(weighted / totalWeight);
}
