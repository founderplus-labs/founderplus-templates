// Goal validation (spec 0009): champion≠reviewer, valid timeframe, anti-cycle parenting.
import { DomainError, type Goal, type Timeframe } from "./types.ts";

export function assertChampionReviewerDistinct(
  championId: string,
  reviewerId: string,
): void {
  if (championId === reviewerId) {
    throw new DomainError(
      "champion_reviewer_same",
      "champion & reviewer harus beda orang",
    );
  }
}

export function assertValidTimeframe(tf: Timeframe): void {
  const start = Date.parse(tf.startDate);
  const end = Date.parse(tf.endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new DomainError("invalid_timeframe", "tanggal timeframe tidak valid");
  }
  if (start >= end) {
    throw new DomainError(
      "invalid_timeframe",
      "timeframe: mulai harus sebelum selesai",
    );
  }
}

/**
 * True if setting `parentId` as the parent of `goalId` would create a cycle:
 * parent is the goal itself, or the goal is already an ancestor of the parent.
 * Walks the ancestor chain of `parentId`; guarded against pre-existing loops.
 */
export function wouldCreateCycle(
  goalsById: ReadonlyMap<string, Goal>,
  goalId: string,
  parentId: string,
): boolean {
  if (parentId === goalId) return true;
  const seen = new Set<string>();
  let cursor: string | null | undefined = parentId;
  while (cursor) {
    if (cursor === goalId) return true; // goalId is an ancestor of parentId
    if (seen.has(cursor)) return true; // pre-existing loop — refuse regardless
    seen.add(cursor);
    cursor = goalsById.get(cursor)?.parentId ?? null;
  }
  return false;
}

export function assertNoCycle(
  goalsById: ReadonlyMap<string, Goal>,
  goalId: string,
  parentId: string,
): void {
  if (wouldCreateCycle(goalsById, goalId, parentId)) {
    throw new DomainError("parent_cycle", "parent membuat siklus alignment");
  }
}
