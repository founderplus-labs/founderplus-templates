// In-memory GoalsService — implements the API contracts + authorization +
// close state machine from specs 0009–0012. Pure/deterministic: inject a clock
// and an id generator so behaviour is testable. A TanStack Start app wraps these
// methods in loaders/actions; a DB adapter swaps the Maps for tables.
import {
  DomainError,
  type CheckIn,
  type CheckInNarrative,
  type CheckInStatus,
  type Goal,
  type GoalOutcome,
  type GoalTreeNode,
  type Space,
  type Target,
  type TargetUnit,
  type Timeframe,
} from "./types.ts";
import {
  assertChampionReviewerDistinct,
  assertNoCycle,
  assertValidTimeframe,
} from "./validate.ts";
import { buildGoalTree } from "./tree.ts";
import { isCheckInOverdue, offTrackNeedsReason, snapshotTargets } from "./checkin.ts";

export interface CreateGoalInput {
  name: string;
  description?: string;
  spaceId: string;
  championId: string;
  reviewerId: string;
  timeframe: Timeframe;
  parentId?: string | null;
  weight?: number;
  cadenceDays?: number;
}

export interface AddTargetInput {
  name: string;
  unit: TargetUnit;
  fromValue: number;
  toValue: number;
  weight?: number;
}

export interface CreateCheckInInput {
  status: CheckInStatus;
  narrative: CheckInNarrative;
  targetUpdates?: Array<{ targetId: string; currentValue: number }>;
}

export interface TreeFilter {
  spaceId?: string;
  championId?: string;
  timeframeType?: Timeframe["type"];
}

export interface ServiceOptions {
  now?: () => Date;
  idGen?: () => string;
}

export class GoalsService {
  private spaces = new Map<string, Space>();
  private goals = new Map<string, Goal>();
  private targets = new Map<string, Target>();
  private checkIns: CheckIn[] = [];
  private now: () => Date;
  private idGen: () => string;
  private seq = 0;

  constructor(opts: ServiceOptions = {}) {
    this.now = opts.now ?? (() => new Date());
    this.idGen = opts.idGen ?? (() => `id_${++this.seq}`);
  }

  // ── stores / auth helpers ────────────────────────────────────────────────
  addSpace(space: Space): Space {
    this.spaces.set(space.id, space);
    return space;
  }

  private requireGoal(id: string): Goal {
    const g = this.goals.get(id);
    if (!g) throw new DomainError("goal_not_found", `goal ${id} tidak ada`);
    return g;
  }

  private assertMember(spaceId: string, actorId: string): void {
    const space = this.spaces.get(spaceId);
    if (!space || !space.memberIds.includes(actorId)) {
      throw new DomainError("forbidden", "bukan anggota space");
    }
  }

  private assertChampion(goal: Goal, actorId: string): void {
    if (goal.championId !== actorId) {
      throw new DomainError("forbidden", "hanya champion yang berwenang");
    }
  }

  private assertReviewer(goal: Goal, actorId: string): void {
    if (goal.reviewerId !== actorId) {
      throw new DomainError("not_reviewer", "hanya reviewer yang berwenang");
    }
  }

  // ── goals (spec 0009) ────────────────────────────────────────────────────
  createGoal(actorId: string, input: CreateGoalInput): Goal {
    this.assertMember(input.spaceId, actorId);
    assertChampionReviewerDistinct(input.championId, input.reviewerId);
    assertValidTimeframe(input.timeframe);
    const id = this.idGen();
    if (input.parentId) assertNoCycle(this.goals, id, input.parentId);
    const goal: Goal = {
      id,
      name: input.name,
      description: input.description,
      spaceId: input.spaceId,
      championId: input.championId,
      reviewerId: input.reviewerId,
      timeframe: input.timeframe,
      parentId: input.parentId ?? null,
      status: "active",
      weight: input.weight,
      cadenceDays: input.cadenceDays ?? 30,
      activatedAt: this.now().toISOString(),
    };
    this.goals.set(id, goal);
    return goal;
  }

  setParent(actorId: string, goalId: string, parentId: string | null): Goal {
    const goal = this.requireGoal(goalId);
    this.assertMember(goal.spaceId, actorId);
    if (parentId) {
      if (!this.goals.has(parentId))
        throw new DomainError("goal_not_found", "parent tidak ada");
      assertNoCycle(this.goals, goalId, parentId);
    }
    goal.parentId = parentId;
    return goal;
  }

  pauseGoal(actorId: string, goalId: string): Goal {
    const goal = this.requireGoal(goalId);
    this.assertMember(goal.spaceId, actorId);
    goal.status = "paused";
    return goal;
  }

  resumeGoal(actorId: string, goalId: string): Goal {
    const goal = this.requireGoal(goalId);
    this.assertMember(goal.spaceId, actorId);
    if (goal.status === "paused") goal.status = "active";
    return goal;
  }

  /** Champion requests close → pending_close (awaits reviewer approval). */
  requestClose(actorId: string, goalId: string, outcome: GoalOutcome): Goal {
    const goal = this.requireGoal(goalId);
    this.assertChampion(goal, actorId);
    if (goal.status !== "active")
      throw new DomainError("invalid_state", "hanya goal aktif bisa diajukan close");
    goal.status = "pending_close";
    goal.outcome = outcome;
    return goal;
  }

  /** Reviewer approves close → closed. Non-reviewer is rejected (403). */
  approveClose(actorId: string, goalId: string): Goal {
    const goal = this.requireGoal(goalId);
    this.assertReviewer(goal, actorId);
    if (goal.status !== "pending_close")
      throw new DomainError("invalid_state", "tidak ada pengajuan close");
    goal.status = "closed";
    return goal;
  }

  // ── targets (spec 0010) ──────────────────────────────────────────────────
  addTarget(actorId: string, goalId: string, input: AddTargetInput): Target {
    const goal = this.requireGoal(goalId);
    this.assertChampion(goal, actorId);
    if (!Number.isFinite(input.fromValue) || !Number.isFinite(input.toValue))
      throw new DomainError("invalid_value", "from/to harus numerik");
    const target: Target = {
      id: this.idGen(),
      goalId,
      name: input.name,
      unit: input.unit,
      fromValue: input.fromValue,
      toValue: input.toValue,
      currentValue: input.fromValue,
      weight: input.weight,
    };
    this.targets.set(target.id, target);
    return target;
  }

  updateTargetValue(actorId: string, targetId: string, currentValue: number): Target {
    const target = this.targets.get(targetId);
    if (!target) throw new DomainError("target_not_found", "target tidak ada");
    const goal = this.requireGoal(target.goalId);
    this.assertChampion(goal, actorId);
    if (!Number.isFinite(currentValue))
      throw new DomainError("invalid_value", "nilai harus numerik");
    target.currentValue = currentValue;
    return target;
  }

  targetsFor(goalId: string): Target[] {
    return [...this.targets.values()].filter((t) => t.goalId === goalId);
  }

  // ── check-ins (spec 0011) ────────────────────────────────────────────────
  createCheckIn(actorId: string, goalId: string, input: CreateCheckInInput): CheckIn {
    const goal = this.requireGoal(goalId);
    this.assertChampion(goal, actorId);
    if (!offTrackNeedsReason(input.status, input.narrative))
      throw new DomainError(
        "reason_required",
        "check-in off_track wajib mengisi obstacles/needs",
      );
    for (const upd of input.targetUpdates ?? []) {
      this.updateTargetValue(actorId, upd.targetId, upd.currentValue);
    }
    const checkIn: CheckIn = {
      id: this.idGen(),
      goalId,
      authorId: actorId,
      status: input.status,
      narrative: input.narrative,
      targetSnapshots: snapshotTargets(this.targetsFor(goalId)),
      createdAt: this.now().toISOString(),
    };
    this.checkIns.push(checkIn);
    return checkIn;
  }

  acknowledgeCheckIn(actorId: string, checkInId: string, comment?: string): CheckIn {
    const checkIn = this.checkIns.find((c) => c.id === checkInId);
    if (!checkIn) throw new DomainError("checkin_not_found", "check-in tidak ada");
    const goal = this.requireGoal(checkIn.goalId);
    this.assertReviewer(goal, actorId); // non-reviewer → not_reviewer (403)
    checkIn.acknowledgedBy = actorId;
    checkIn.acknowledgedAt = this.now().toISOString();
    if (comment) checkIn.reviewerComment = comment;
    return checkIn;
  }

  checkInsFor(goalId: string): CheckIn[] {
    return this.checkIns.filter((c) => c.goalId === goalId);
  }

  /** Active goals past their check-in cadence (spec 0011). Paused/closed excluded. */
  overdueGoals(now: Date = this.now()): Goal[] {
    return [...this.goals.values()].filter((g) =>
      isCheckInOverdue(g, this.checkInsFor(g.id), now),
    );
  }

  // ── alignment tree (spec 0012) ───────────────────────────────────────────
  getGoalTree(filter: TreeFilter = {}): GoalTreeNode[] {
    let goals = [...this.goals.values()];
    if (filter.spaceId) goals = goals.filter((g) => g.spaceId === filter.spaceId);
    if (filter.championId)
      goals = goals.filter((g) => g.championId === filter.championId);
    if (filter.timeframeType)
      goals = goals.filter((g) => g.timeframe.type === filter.timeframeType);

    const targetsByGoal = new Map<string, Target[]>();
    const checkInsByGoal = new Map<string, CheckIn[]>();
    for (const g of goals) {
      targetsByGoal.set(g.id, this.targetsFor(g.id));
      checkInsByGoal.set(g.id, this.checkInsFor(g.id));
    }
    return buildGoalTree(goals, { targetsByGoal, checkInsByGoal });
  }

  getGoal(id: string): Goal | undefined {
    return this.goals.get(id);
  }
}
