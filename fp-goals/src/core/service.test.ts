// Specs 0009–0012 — service behaviour: access-level authorization, targets,
// checklist, close state machine, check-in + acknowledge/comment/react, rollup.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GoalsService, type CreateGoalInput } from "./service.ts";
import { AccessLevel } from "./permissions.ts";
import { computeChecksProgress } from "./checks.ts";
import { DomainError, type Timeframe } from "./types.ts";

const tf: Timeframe = { type: "quarter", startDate: "2026-01-01", endDate: "2026-03-31" };

function setup() {
  let clock = new Date("2026-01-01T00:00:00Z");
  const svc = new GoalsService({ now: () => clock });
  svc.addSpace({
    id: "growth",
    companyId: "co",
    name: "Growth",
    members: [
      { personId: "champ", accessLevel: AccessLevel.EDIT },
      { personId: "rev", accessLevel: AccessLevel.COMMENT },
      { personId: "member", accessLevel: AccessLevel.COMMENT },
      { personId: "viewer", accessLevel: AccessLevel.VIEW },
      { personId: "admin", accessLevel: AccessLevel.FULL },
    ],
  });
  const base: CreateGoalInput = {
    name: "Grow MRR",
    companyId: "co",
    spaceId: "growth",
    championId: "champ",
    reviewerId: "rev",
    timeframe: tf,
  };
  return { svc, base, tick: (d: string) => (clock = new Date(d)) };
}

test("createGoal needs edit access; sets schedule", () => {
  const { svc, base } = setup();
  assert.throws(
    () => svc.createGoal("member", base), // COMMENT < EDIT
    (e: unknown) => e instanceof DomainError && e.code === "forbidden",
  );
  const goal = svc.createGoal("champ", base);
  assert.equal(goal.status, "active");
  assert.equal(goal.nextUpdateScheduledAt, "2026-01-31T00:00:00.000Z");
});

test("createGoal rejects champion===reviewer and bad timeframe", () => {
  const { svc, base } = setup();
  assert.throws(
    () => svc.createGoal("champ", { ...base, reviewerId: "champ" }),
    (e: unknown) => e instanceof DomainError && e.code === "champion_reviewer_same",
  );
  assert.throws(
    () =>
      svc.createGoal("champ", {
        ...base,
        timeframe: { type: "quarter", startDate: "2026-03-01", endDate: "2026-01-01" },
      }),
    (e: unknown) => e instanceof DomainError && e.code === "invalid_timeframe",
  );
});

test("setParent refuses cycles", () => {
  const { svc, base } = setup();
  const a = svc.createGoal("champ", base);
  const b = svc.createGoal("champ", { ...base, parentId: a.id });
  assert.throws(
    () => svc.setParent("champ", a.id, b.id),
    (e: unknown) => e instanceof DomainError && e.code === "parent_cycle",
  );
});

test("targets: only manage access adds; value starts at from and updates", () => {
  const { svc, base } = setup();
  const goal = svc.createGoal("champ", base);
  assert.throws(
    () => svc.addTarget("viewer", goal.id, { name: "MRR", unit: "currency", from: 0, to: 100 }),
    (e: unknown) => e instanceof DomainError && e.code === "forbidden",
  );
  const t = svc.addTarget("champ", goal.id, { name: "MRR", unit: "currency", from: 0, to: 100 });
  assert.equal(t.value, 0); // starts at `from`
  assert.equal(t.index, 0);
  svc.updateTargetValue("champ", t.id, 45);
  assert.equal(svc.targetsFor(goal.id)[0]!.value, 45);
});

test("goal checklist: add + toggle drives checklist progress", () => {
  const { svc, base } = setup();
  const goal = svc.createGoal("champ", base);
  const c1 = svc.addCheck("champ", goal.id, "ship landing");
  svc.addCheck("champ", goal.id, "write docs");
  assert.equal(computeChecksProgress(svc.checksFor(goal.id)), 0);
  svc.toggleCheck("champ", c1.id, true);
  assert.equal(computeChecksProgress(svc.checksFor(goal.id)), 50);
});

test("close state machine: pending until reviewer approves; non-reviewer 403; retro captured", () => {
  const { svc, base, tick } = setup();
  const goal = svc.createGoal("champ", base);
  const pending = svc.requestClose("champ", goal.id, "achieved", "hit target");
  assert.equal(pending.status, "pending_close");
  assert.equal(pending.successStatus, "achieved");
  assert.throws(
    () => svc.approveClose("member", goal.id),
    (e: unknown) => e instanceof DomainError && e.code === "not_reviewer",
  );
  assert.equal(svc.getGoal(goal.id)!.status, "pending_close");
  tick("2026-03-30T00:00:00Z");
  const closed = svc.approveClose("rev", goal.id, "learned a lot");
  assert.equal(closed.status, "closed");
  assert.equal(closed.closedById, "rev");
  assert.equal(closed.closedAt, "2026-03-30T00:00:00.000Z");
  assert.equal(closed.retrospective, "learned a lot");
});

test("check-in: off_track needs reason; snapshots targets+checks; reviewer acks; member comments", () => {
  const { svc, base, tick } = setup();
  const goal = svc.createGoal("champ", base);
  const t = svc.addTarget("champ", goal.id, { name: "MRR", unit: "number", from: 0, to: 100 });
  svc.addCheck("champ", goal.id, "launch");

  assert.throws(
    () =>
      svc.createCheckIn("champ", goal.id, {
        status: "off_track",
        message: { wins: "", obstacles: "", needs: "" },
      }),
    (e: unknown) => e instanceof DomainError && e.code === "reason_required",
  );

  tick("2026-02-01T00:00:00Z");
  const ci = svc.createCheckIn("champ", goal.id, {
    status: "caution",
    message: { wins: "signups up", obstacles: "churn", needs: "hire" },
    targetUpdates: [{ targetId: t.id, value: 40 }],
  });
  assert.equal(ci.targets[0]!.progress, 40); // snapshot captured update
  assert.equal(ci.checks[0]!.name, "launch"); // checklist snapshot
  assert.equal(svc.getGoal(goal.id)!.lastUpdateStatus, "caution");
  assert.equal(svc.getGoal(goal.id)!.nextUpdateScheduledAt, "2026-03-03T00:00:00.000Z");

  // acknowledge: reviewer only
  assert.throws(
    () => svc.acknowledgeCheckIn("member", ci.id),
    (e: unknown) => e instanceof DomainError && e.code === "not_reviewer",
  );
  const acked = svc.acknowledgeCheckIn("rev", ci.id);
  assert.equal(acked.acknowledgedById, "rev");

  // comment: needs comment access — member yes, outsider no
  svc.commentOnCheckIn("member", ci.id, "nice");
  svc.reactToCheckIn("member", ci.id, "🎉");
  assert.equal(ci.comments.length, 1);
  assert.equal(ci.reactions.length, 1);
  assert.throws(
    () => svc.commentOnCheckIn("outsider", ci.id, "hi"),
    (e: unknown) => e instanceof DomainError && e.code === "forbidden",
  );
});

test("overdueGoals surfaces active goals past schedule, excludes paused", () => {
  const { svc, base, tick } = setup();
  const goal = svc.createGoal("champ", base); // due 2026-01-31
  tick("2026-02-15T00:00:00Z");
  assert.deepEqual(svc.overdueGoals().map((g) => g.id), [goal.id]);
  svc.pauseGoal("champ", goal.id);
  assert.deepEqual(svc.overdueGoals(), []);
});

test("getGoalTree rolls up a hierarchy and filters", () => {
  const { svc, base } = setup();
  const company = svc.createGoal("champ", { ...base, name: "Company" });
  const child = svc.createGoal("champ", { ...base, name: "Child", parentId: company.id });
  const tc = svc.addTarget("champ", child.id, { name: "kr", unit: "percent", from: 0, to: 100 });
  svc.updateTargetValue("champ", tc.id, 60);

  const root = svc.getGoalTree({ spaceId: "growth" }).find((n) => n.id === company.id)!;
  assert.equal(root.rollup.progress, 60);
  assert.equal(root.children[0]!.progress, 60);
  assert.deepEqual(svc.getGoalTree({ championId: "nobody" }), []);
});

test("getPermissions reflects roles", () => {
  const { svc, base } = setup();
  const goal = svc.createGoal("champ", base);
  assert.equal(svc.getPermissions("champ", goal.id).canCheckIn, true);
  assert.equal(svc.getPermissions("rev", goal.id).canApproveClose, true);
  assert.equal(svc.getPermissions("viewer", goal.id).canCheckIn, false);
});
