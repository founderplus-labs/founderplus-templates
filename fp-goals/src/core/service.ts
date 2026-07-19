// In-memory GoalsService — implements the API contracts + access-level
// permissions + close state machine from specs 0009–0012, modelled on Operately.
// Deterministic: inject a clock + id generator. Swap the Maps for DB tables in prod.
import {
  DomainError,
  type CheckIn,
  type CheckInMessage,
  type CheckInStatus,
  type Comment,
  type Goal,
  type GoalCheck,
  type GoalPermissions,
  type GoalSuccessStatus,
  type GoalTreeNode,
  type Reaction,
  type Space,
  type Target,
  type Timeframe,
} from "./types.ts";
import {
  assertChampionReviewerDistinct,
  assertNoCycle,
  assertValidTimeframe,
} from "./validate.ts";
import { AccessLevel, goalPermissions } from "./permissions.ts";
import { buildGoalTree } from "./tree.ts";
import {
  computeNextUpdateAt,
  isCheckInOverdue,
  offTrackNeedsReason,
  snapshotChecks,
  snapshotTargets,
} from "./checkin.ts";
import { nextCheckIndex } from "./checks.ts";

export interface CreateGoalInput {
  name: string;
  description?: string;
  companyId: string;
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
  unit: string;
  from: number;
  to: number;
  weight?: number;
}

export interface CreateCheckInInput {
  status: CheckInStatus;
  message: CheckInMessage;
  targetUpdates?: Array<{ targetId: string; value: number }>;
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
  private checks = new Map<string, GoalCheck>();
  private checkIns: CheckIn[] = [];
  private now: () => Date;
  private idGen: () => string;
  private seq = 0;

  constructor(opts: ServiceOptions = {}) {
    this.now = opts.now ?? (() => new Date());
    this.idGen = opts.idGen ?? (() => `id_${++this.seq}`);
  }

  // ── stores / access ──────────────────────────────────────────────────────
  addSpace(space: Space): Space {
    this.spaces.set(space.id, space);
    return space;
  }

  private requireGoal(id: string): Goal {
    const g = this.goals.get(id);
    if (!g) throw new DomainError("goal_not_found", `goal ${id} tidak ada`);
    return g;
  }

  /** Effective access level of a person on a goal: space membership, with
   *  champion/reviewer promoted to at least EDIT on their own goal. */
  accessLevelFor(goal: Goal, personId: string): number {
    const member = this.spaces.get(goal.spaceId)?.members.find((m) => m.personId === personId);
    let level = member?.accessLevel ?? AccessLevel.NONE;
    if (personId === goal.championId || personId === goal.reviewerId) {
      level = Math.max(level, AccessLevel.EDIT);
    }
    return level;
  }

  getPermissions(personId: string, goalId: string): GoalPermissions {
    const goal = this.requireGoal(goalId);
    return goalPermissions(goal, personId, this.accessLevelFor(goal, personId));
  }

  private perms(goal: Goal, personId: string): GoalPermissions {
    return goalPermissions(goal, personId, this.accessLevelFor(goal, personId));
  }

  // ── goals (spec 0009) ────────────────────────────────────────────────────
  createGoal(actorId: string, input: CreateGoalInput): Goal {
    const member = this.spaces.get(input.spaceId)?.members.find((m) => m.personId === actorId);
    if (!member || member.accessLevel < AccessLevel.EDIT) {
      throw new DomainError("forbidden", "butuh akses edit di space untuk membuat goal");
    }
    assertChampionReviewerDistinct(input.championId, input.reviewerId);
    assertValidTimeframe(input.timeframe);
    const id = this.idGen();
    if (input.parentId) assertNoCycle(this.goals, id, input.parentId);
    const activatedAt = this.now().toISOString();
    const goal: Goal = {
      id,
      name: input.name,
      description: input.description,
      companyId: input.companyId,
      spaceId: input.spaceId,
      parentId: input.parentId ?? null,
      championId: input.championId,
      reviewerId: input.reviewerId,
      creatorId: actorId,
      timeframe: input.timeframe,
      status: "active",
      weight: input.weight,
      cadenceDays: input.cadenceDays ?? 30,
      activatedAt,
      nextUpdateScheduledAt: computeNextUpdateAt(activatedAt, input.cadenceDays ?? 30),
    };
    this.goals.set(id, goal);
    return goal;
  }

  setParent(actorId: string, goalId: string, parentId: string | null): Goal {
    const goal = this.requireGoal(goalId);
    if (!this.perms(goal, actorId).canEdit) throw new DomainError("forbidden", "butuh akses edit");
    if (parentId) {
      if (!this.goals.has(parentId)) throw new DomainError("goal_not_found", "parent tidak ada");
      assertNoCycle(this.goals, goalId, parentId);
    }
    goal.parentId = parentId;
    return goal;
  }

  pauseGoal(actorId: string, goalId: string): Goal {
    const goal = this.requireGoal(goalId);
    if (!this.perms(goal, actorId).canEdit) throw new DomainError("forbidden", "butuh akses edit");
    goal.status = "paused";
    return goal;
  }

  resumeGoal(actorId: string, goalId: string): Goal {
    const goal = this.requireGoal(goalId);
    if (!this.perms(goal, actorId).canEdit) throw new DomainError("forbidden", "butuh akses edit");
    if (goal.status === "paused") goal.status = "active";
    return goal;
  }

  /** Champion requests close with outcome + success text → pending_close. */
  requestClose(
    actorId: string,
    goalId: string,
    successStatus: GoalSuccessStatus,
    success = "",
  ): Goal {
    const goal = this.requireGoal(goalId);
    if (!this.perms(goal, actorId).canRequestClose)
      throw new DomainError("forbidden", "hanya champion yang mengajukan close");
    if (goal.status !== "active")
      throw new DomainError("invalid_state", "hanya goal aktif bisa diajukan close");
    goal.status = "pending_close";
    goal.successStatus = successStatus;
    goal.success = success;
    return goal;
  }

  /** Reviewer approves close (optionally with a retrospective) → closed. */
  approveClose(actorId: string, goalId: string, retrospective = ""): Goal {
    const goal = this.requireGoal(goalId);
    if (!this.perms(goal, actorId).canApproveClose)
      throw new DomainError("not_reviewer", "hanya reviewer yang menyetujui close");
    if (goal.status !== "pending_close")
      throw new DomainError("invalid_state", "tidak ada pengajuan close");
    goal.status = "closed";
    goal.closedAt = this.now().toISOString();
    goal.closedById = actorId;
    if (retrospective) goal.retrospective = retrospective;
    return goal;
  }

  // ── targets (spec 0010) ──────────────────────────────────────────────────
  addTarget(actorId: string, goalId: string, input: AddTargetInput): Target {
    const goal = this.requireGoal(goalId);
    if (!this.perms(goal, actorId).canManageTargets)
      throw new DomainError("forbidden", "butuh akses untuk mengelola target");
    if (!Number.isFinite(input.from) || !Number.isFinite(input.to))
      throw new DomainError("invalid_value", "from/to harus numerik");
    const target: Target = {
      id: this.idGen(),
      goalId,
      name: input.name,
      unit: input.unit,
      from: input.from,
      to: input.to,
      value: input.from,
      index: this.targetsFor(goalId).length,
      weight: input.weight,
    };
    this.targets.set(target.id, target);
    return target;
  }

  updateTargetValue(actorId: string, targetId: string, value: number): Target {
    const target = this.targets.get(targetId);
    if (!target) throw new DomainError("target_not_found", "target tidak ada");
    const goal = this.requireGoal(target.goalId);
    if (!this.perms(goal, actorId).canManageTargets)
      throw new DomainError("forbidden", "butuh akses untuk mengubah target");
    if (!Number.isFinite(value)) throw new DomainError("invalid_value", "nilai harus numerik");
    target.value = value;
    return target;
  }

  targetsFor(goalId: string): Target[] {
    return [...this.targets.values()]
      .filter((t) => t.goalId === goalId)
      .sort((a, b) => a.index - b.index);
  }

  // ── goal checklist "checks" (Operately Goals.Check) ──────────────────────
  addCheck(actorId: string, goalId: string, name: string): GoalCheck {
    const goal = this.requireGoal(goalId);
    if (!this.perms(goal, actorId).canManageChecks)
      throw new DomainError("forbidden", "butuh akses untuk mengelola checklist");
    const check: GoalCheck = {
      id: this.idGen(),
      goalId,
      creatorId: actorId,
      name,
      completed: false,
      index: nextCheckIndex(this.checksFor(goalId)),
    };
    this.checks.set(check.id, check);
    return check;
  }

  toggleCheck(actorId: string, checkId: string, completed: boolean): GoalCheck {
    const check = this.checks.get(checkId);
    if (!check) throw new DomainError("check_not_found", "check tidak ada");
    const goal = this.requireGoal(check.goalId);
    if (!this.perms(goal, actorId).canManageChecks)
      throw new DomainError("forbidden", "butuh akses untuk mengubah checklist");
    check.completed = completed;
    check.completedAt = completed ? this.now().toISOString() : undefined;
    return check;
  }

  checksFor(goalId: string): GoalCheck[] {
    return [...this.checks.values()]
      .filter((c) => c.goalId === goalId)
      .sort((a, b) => a.index - b.index);
  }

  // ── check-ins (spec 0011) ────────────────────────────────────────────────
  createCheckIn(actorId: string, goalId: string, input: CreateCheckInInput): CheckIn {
    const goal = this.requireGoal(goalId);
    if (!this.perms(goal, actorId).canCheckIn)
      throw new DomainError("forbidden", "hanya champion yang check-in");
    if (!offTrackNeedsReason(input.status, input.message))
      throw new DomainError("reason_required", "check-in off_track wajib mengisi obstacles/needs");
    for (const upd of input.targetUpdates ?? []) {
      this.updateTargetValue(actorId, upd.targetId, upd.value);
    }
    const nowIso = this.now().toISOString();
    const checkIn: CheckIn = {
      id: this.idGen(),
      goalId,
      authorId: actorId,
      status: input.status,
      message: input.message,
      state: "published",
      publishedAt: nowIso,
      timeframe: goal.timeframe,
      targets: snapshotTargets(this.targetsFor(goalId)),
      checks: snapshotChecks(this.checksFor(goalId)),
      reactions: [],
      comments: [],
      createdAt: nowIso,
    };
    this.checkIns.push(checkIn);
    // Advance the schedule + denormalised status (Operately last_update_status).
    goal.lastUpdateStatus = input.status;
    goal.nextUpdateScheduledAt = computeNextUpdateAt(nowIso, goal.cadenceDays);
    return checkIn;
  }

  acknowledgeCheckIn(actorId: string, checkInId: string): CheckIn {
    const checkIn = this.requireCheckIn(checkInId);
    const goal = this.requireGoal(checkIn.goalId);
    if (!this.perms(goal, actorId).canAcknowledgeCheckIn)
      throw new DomainError("not_reviewer", "hanya reviewer yang acknowledge");
    checkIn.acknowledgedById = actorId;
    checkIn.acknowledgedAt = this.now().toISOString();
    return checkIn;
  }

  commentOnCheckIn(actorId: string, checkInId: string, content: string): Comment {
    const checkIn = this.requireCheckIn(checkInId);
    const goal = this.requireGoal(checkIn.goalId);
    if (!this.perms(goal, actorId).canComment)
      throw new DomainError("forbidden", "butuh akses comment");
    const comment: Comment = {
      id: this.idGen(),
      authorId: actorId,
      content,
      createdAt: this.now().toISOString(),
    };
    checkIn.comments.push(comment);
    return comment;
  }

  reactToCheckIn(actorId: string, checkInId: string, emoji: string): Reaction {
    const checkIn = this.requireCheckIn(checkInId);
    const goal = this.requireGoal(checkIn.goalId);
    if (!this.perms(goal, actorId).canComment)
      throw new DomainError("forbidden", "butuh akses comment");
    const reaction: Reaction = { id: this.idGen(), personId: actorId, emoji };
    checkIn.reactions.push(reaction);
    return reaction;
  }

  private requireCheckIn(id: string): CheckIn {
    const c = this.checkIns.find((x) => x.id === id);
    if (!c) throw new DomainError("checkin_not_found", "check-in tidak ada");
    return c;
  }

  checkInsFor(goalId: string): CheckIn[] {
    return this.checkIns
      .filter((c) => c.goalId === goalId)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }

  /** Active goals past their scheduled check-in (spec 0011). Paused/closed excluded. */
  overdueGoals(now: Date = this.now()): Goal[] {
    return [...this.goals.values()].filter((g) => isCheckInOverdue(g, now));
  }

  // ── alignment tree (spec 0012) ───────────────────────────────────────────
  getGoalTree(filter: TreeFilter = {}): GoalTreeNode[] {
    let goals = [...this.goals.values()];
    if (filter.spaceId) goals = goals.filter((g) => g.spaceId === filter.spaceId);
    if (filter.championId) goals = goals.filter((g) => g.championId === filter.championId);
    if (filter.timeframeType)
      goals = goals.filter((g) => g.timeframe.type === filter.timeframeType);

    const targetsByGoal = new Map<string, Target[]>();
    for (const g of goals) targetsByGoal.set(g.id, this.targetsFor(g.id));
    return buildGoalTree(goals, { targetsByGoal });
  }

  getGoal(id: string): Goal | undefined {
    return this.goals.get(id);
  }
}
