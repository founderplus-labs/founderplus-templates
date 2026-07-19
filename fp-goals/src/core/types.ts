// OKR domain types — modelled closely on operately/operately
// (app/lib/operately/goals/*.ex). Framework-agnostic; a TanStack Start
// (fp-fullstack) app imports this core and wraps it in loaders/actions.

// ── Goal ─────────────────────────────────────────────────────────────────────
/** Goal lifecycle. Operately tracks this via closed_at + success_status. */
export type GoalStatus = "draft" | "active" | "pending_close" | "closed" | "paused";

/** Operately Goal.success_status is :achieved | :missed. */
export type GoalSuccessStatus = "achieved" | "missed";

/** Check-in status — Operately Update.valid_statuses(). */
export type CheckInStatus = "on_track" | "caution" | "off_track";

/** Health used in the alignment-tree rollup: check-in statuses + non-measured states. */
export type HealthStatus = CheckInStatus | "paused" | "unmeasured";

/** Operately Update.state — we model published/draft (scheduled is future-dated). */
export type UpdateState = "draft" | "published" | "scheduled";

/** Timeframe types mirror Operately.ContextualDates.Timeframe. */
export type TimeframeType = "days" | "month" | "quarter" | "year";

export interface Timeframe {
  type: TimeframeType;
  /** ISO date (YYYY-MM-DD). */
  startDate: string;
  /** ISO date (YYYY-MM-DD). */
  endDate: string;
}

/** Target (key result) — Operately Goals.Target: from/to/unit/value/index. */
export interface Target {
  id: string;
  goalId: string;
  name: string;
  unit: string; // "number" | "percent" | "currency" | "boolean" | free text
  from: number;
  to: number;
  /** Current value (Operately: `value`). Starts at `from`. */
  value: number;
  /** Display/order index within the goal. */
  index: number;
  /** Rollup weight among sibling targets. Default 1. */
  weight?: number;
}

/** Goal checklist item — Operately Goals.Check: name/completed/index. */
export interface GoalCheck {
  id: string;
  goalId: string;
  creatorId: string;
  name: string;
  completed: boolean;
  completedAt?: string;
  index: number;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  /** Operately calls the space a "group". */
  spaceId: string;
  parentId?: string | null;
  championId: string;
  reviewerId: string;
  creatorId: string;
  timeframe: Timeframe;
  status: GoalStatus;
  /** Rollup weight among sibling goals in the alignment tree. Default 1. */
  weight?: number;
  /** Check-in cadence in days. Default 30 (monthly). */
  cadenceDays: number;
  activatedAt?: string;
  /** Denormalised latest check-in status (Operately: last_update_status). */
  lastUpdateStatus?: CheckInStatus;
  /** When the next check-in is due (Operately: next_update_scheduled_at). */
  nextUpdateScheduledAt?: string;
  // Close (Operately: closed_at/closed_by/success/success_status).
  closedAt?: string;
  closedById?: string;
  success?: string;
  successStatus?: GoalSuccessStatus;
  /** Retrospective text captured at close. */
  retrospective?: string;
}

// ── Check-in (Operately Goals.Update) ────────────────────────────────────────
export interface Reaction {
  id: string;
  personId: string;
  emoji: string;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

/** Immutable snapshots embedded in a check-in (Operately embeds_many). */
export interface TargetSnapshot {
  targetId: string;
  name: string;
  value: number;
  progress: number;
}

export interface CheckSnapshot {
  checkId: string;
  name: string;
  completed: boolean;
}

export interface CheckIn {
  id: string;
  goalId: string;
  authorId: string;
  status: CheckInStatus;
  /** Rich message (wins/obstacles/needs or freeform). */
  message: CheckInMessage;
  state: UpdateState;
  publishedAt?: string;
  scheduledAt?: string;
  acknowledgedAt?: string;
  acknowledgedById?: string;
  /** Snapshots taken at publish time. */
  timeframe: Timeframe;
  targets: TargetSnapshot[];
  checks: CheckSnapshot[];
  reactions: Reaction[];
  comments: Comment[];
  createdAt: string;
}

export interface CheckInMessage {
  wins: string;
  obstacles: string;
  needs: string;
}

// ── Access & permissions (Operately Access.Binding + Goals.Permissions) ───────
export interface Space {
  id: string;
  companyId: string;
  name: string;
  members: SpaceMember[];
}

export interface SpaceMember {
  personId: string;
  /** Access level constant (see permissions.ts AccessLevel). */
  accessLevel: number;
}

export interface GoalPermissions {
  canView: boolean;
  canComment: boolean;
  canEdit: boolean;
  hasFullAccess: boolean;
  canCheckIn: boolean;
  canAcknowledgeCheckIn: boolean;
  canRequestClose: boolean;
  canApproveClose: boolean;
  canManageTargets: boolean;
  canManageChecks: boolean;
}

// ── Alignment tree (Operately Work Map) ──────────────────────────────────────
export interface GoalTreeNode {
  id: string;
  name: string;
  status: HealthStatus;
  progress: number | null; // own progress; null = unmeasured
  rollup: {
    progress: number | null;
    status: HealthStatus;
    childCount: number;
  };
  parentId: string | null;
  children: GoalTreeNode[];
}

/** Typed domain error so the HTTP layer can map to 4xx codes. */
export class DomainError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message ?? code);
    this.name = "DomainError";
    this.code = code;
  }
}
