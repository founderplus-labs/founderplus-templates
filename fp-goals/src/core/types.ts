// OKR domain types — the shape the specs 0009–0012 pin down.
// Framework-agnostic. A TanStack Start (fp-fullstack) app imports this core;
// the HTTP/UI layer is a thin wrapper over the pure functions + GoalsService.

/** Goal lifecycle (spec 0009). */
export type GoalStatus =
  | "draft"
  | "active"
  | "pending_close" // close requested by champion, awaiting reviewer
  | "closed"
  | "paused";

/** Outcome recorded when a goal is closed (spec 0009). */
export type GoalOutcome = "achieved" | "missed" | "dropped";

/** Qualitative check-in status — the red/yellow/green of OKR (spec 0011). */
export type CheckInStatus = "on_track" | "caution" | "off_track";

/**
 * Health status used in the alignment tree rollup (spec 0012). Superset of
 * CheckInStatus plus states a node can have without a check-in.
 */
export type HealthStatus = CheckInStatus | "paused" | "unmeasured";

/** Target (key result) unit (spec 0010). */
export type TargetUnit = "number" | "percent" | "currency" | "boolean";

export interface Timeframe {
  type: "quarter" | "year" | "custom";
  /** ISO date (YYYY-MM-DD). */
  startDate: string;
  /** ISO date (YYYY-MM-DD). */
  endDate: string;
}

export interface Target {
  id: string;
  goalId: string;
  name: string;
  unit: TargetUnit;
  fromValue: number;
  toValue: number;
  currentValue: number;
  /** Rollup weight among sibling targets (spec 0010). Default 1. */
  weight?: number;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  spaceId: string;
  championId: string;
  reviewerId: string;
  timeframe: Timeframe;
  parentId?: string | null;
  status: GoalStatus;
  outcome?: GoalOutcome;
  /** Rollup weight among sibling goals in the alignment tree (spec 0012). Default 1. */
  weight?: number;
  /** Check-in cadence in days (spec 0011). Default 30 (monthly). */
  cadenceDays: number;
  /** ISO datetime the goal became active — cadence anchor. */
  activatedAt?: string;
}

export interface CheckInNarrative {
  wins: string;
  obstacles: string;
  needs: string;
}

export interface TargetSnapshot {
  targetId: string;
  currentValue: number;
  progress: number;
}

export interface CheckIn {
  id: string;
  goalId: string;
  authorId: string;
  status: CheckInStatus;
  narrative: CheckInNarrative;
  targetSnapshots: TargetSnapshot[];
  /** ISO datetime. */
  createdAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  reviewerComment?: string;
}

export interface Space {
  id: string;
  name: string;
  memberIds: string[];
}

/** Node emitted by getGoalTree (spec 0012 API contract). */
export interface GoalTreeNode {
  id: string;
  name: string;
  status: HealthStatus;
  /** Own progress from this goal's targets; null = unmeasured. */
  progress: number | null;
  rollup: {
    /** Aggregate progress over the subtree (self + descendants); null if all unmeasured. */
    progress: number | null;
    /** Worst-wins status over the subtree. */
    status: HealthStatus;
    childCount: number;
  };
  parentId: string | null;
  children: GoalTreeNode[];
}

/** Typed domain error so the HTTP layer can map to 4xx codes (spec contracts). */
export class DomainError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = "DomainError";
    this.code = code;
  }
}
