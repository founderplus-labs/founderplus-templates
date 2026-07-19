// Check-in cadence & status helpers (spec 0011).
import type { CheckIn, CheckInStatus, Goal, HealthStatus, Target } from "./types.ts";
import { targetProgress } from "./progress.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Severity ordering for worst-wins rollup (spec 0012). Higher = worse. */
export function statusSeverity(s: HealthStatus): number {
  switch (s) {
    case "off_track":
      return 3;
    case "caution":
      return 2;
    case "on_track":
      return 1;
    // paused / unmeasured don't participate in worst-wins
    default:
      return 0;
  }
}

/** The more severe of two health statuses (worst wins; measured beats unmeasured). */
export function worseStatus(a: HealthStatus, b: HealthStatus): HealthStatus {
  return statusSeverity(a) >= statusSeverity(b) ? a : b;
}

/** Latest check-in for a goal, or null. */
export function latestCheckIn(checkIns: CheckIn[]): CheckIn | null {
  if (checkIns.length === 0) return null;
  return checkIns.reduce((a, b) =>
    Date.parse(a.createdAt) >= Date.parse(b.createdAt) ? a : b,
  );
}

/** A goal's current health for the tree: latest check-in status, or paused/unmeasured. */
export function goalHealth(goal: Goal, checkIns: CheckIn[]): HealthStatus {
  if (goal.status === "paused") return "paused";
  const latest = latestCheckIn(checkIns);
  return latest ? latest.status : "unmeasured";
}

/**
 * Is a goal overdue for a check-in (spec 0011)?
 * Only `active` goals can be overdue — paused/closed/draft are excluded.
 * Overdue when the time since the last check-in (or activation) exceeds cadence.
 */
export function isCheckInOverdue(
  goal: Goal,
  checkIns: CheckIn[],
  now: Date,
): boolean {
  if (goal.status !== "active") return false;
  const anchorIso =
    latestCheckIn(checkIns)?.createdAt ?? goal.activatedAt ?? null;
  if (!anchorIso) return false;
  const elapsedDays = (now.getTime() - Date.parse(anchorIso)) / DAY_MS;
  return elapsedDays > goal.cadenceDays;
}

/** Snapshot the current value + computed progress of each target (spec 0011). */
export function snapshotTargets(targets: Target[]) {
  return targets.map((t) => ({
    targetId: t.id,
    currentValue: t.currentValue,
    progress: targetProgress(t),
  }));
}

/**
 * Off-track check-ins must explain themselves (spec 0011 US-1): when status is
 * off_track, at least one of obstacles/needs must be non-empty.
 */
export function offTrackNeedsReason(
  status: CheckInStatus,
  narrative: { obstacles: string; needs: string },
): boolean {
  if (status !== "off_track") return true;
  return narrative.obstacles.trim().length > 0 || narrative.needs.trim().length > 0;
}
