// Check-in helpers (spec 0011) — status severity, scheduling (Operately
// next_update_scheduled_at), and immutable snapshots embedded in an update.
import type {
  CheckIn,
  CheckInMessage,
  CheckInStatus,
  GoalCheck,
  Goal,
  HealthStatus,
  Target,
} from "./types.ts";
import { targetProgressPercentage } from "./progress.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Severity ordering for worst-wins rollup. Higher = worse. */
export function statusSeverity(s: HealthStatus): number {
  switch (s) {
    case "off_track":
      return 3;
    case "caution":
      return 2;
    case "on_track":
      return 1;
    default:
      return 0; // paused / unmeasured don't participate
  }
}

export function worseStatus(a: HealthStatus, b: HealthStatus): HealthStatus {
  return statusSeverity(a) >= statusSeverity(b) ? a : b;
}

/** A goal's current health for the tree: last check-in status, or paused/unmeasured. */
export function goalHealth(goal: Goal): HealthStatus {
  if (goal.status === "paused") return "paused";
  return goal.lastUpdateStatus ?? "unmeasured";
}

/** ISO datetime `cadenceDays` after `fromIso`. */
export function computeNextUpdateAt(fromIso: string, cadenceDays: number): string {
  return new Date(Date.parse(fromIso) + cadenceDays * DAY_MS).toISOString();
}

/**
 * Is a goal overdue for a check-in? Only `active` goals can be overdue; the due
 * date is the denormalised `nextUpdateScheduledAt` (Operately). Paused/closed
 * goals are excluded.
 */
export function isCheckInOverdue(goal: Goal, now: Date): boolean {
  if (goal.status !== "active" || !goal.nextUpdateScheduledAt) return false;
  return now.getTime() > Date.parse(goal.nextUpdateScheduledAt);
}

/** Snapshot the current value + progress of each target (embedded in the update). */
export function snapshotTargets(targets: Target[]) {
  return [...targets]
    .sort((a, b) => a.index - b.index)
    .map((t) => ({
      targetId: t.id,
      name: t.name,
      value: t.value,
      progress: targetProgressPercentage(t),
    }));
}

/** Snapshot the checklist state (embedded in the update). */
export function snapshotChecks(checks: GoalCheck[]) {
  return [...checks]
    .sort((a, b) => a.index - b.index)
    .map((c) => ({ checkId: c.id, name: c.name, completed: c.completed }));
}

/**
 * Off-track check-ins must explain themselves: when status is off_track, at
 * least one of obstacles/needs must be non-empty.
 */
export function offTrackNeedsReason(
  status: CheckInStatus,
  message: Pick<CheckInMessage, "obstacles" | "needs">,
): boolean {
  if (status !== "off_track") return true;
  return message.obstacles.trim().length > 0 || message.needs.trim().length > 0;
}

export function latestCheckIn(checkIns: CheckIn[]): CheckIn | null {
  if (checkIns.length === 0) return null;
  return checkIns.reduce((a, b) =>
    Date.parse(a.createdAt) >= Date.parse(b.createdAt) ? a : b,
  );
}
