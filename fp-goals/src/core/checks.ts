// Goal checklist "checks" (Operately Goals.Check) — a simple done/not-done list
// on a goal, distinct from numeric Targets. Used for qualitative milestones.
import type { GoalCheck } from "./types.ts";

/** Progress of a checklist as integer 0..100; null when empty (unmeasured). */
export function computeChecksProgress(checks: GoalCheck[]): number | null {
  if (checks.length === 0) return null;
  const done = checks.filter((c) => c.completed).length;
  return Math.round((done / checks.length) * 100);
}

/** Next index to append a check at (keeps a stable order). */
export function nextCheckIndex(checks: GoalCheck[]): number {
  return checks.reduce((max, c) => Math.max(max, c.index), -1) + 1;
}
