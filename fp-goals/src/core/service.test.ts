// Specs 0009–0012 — service behaviour: authorization, close state machine,
// check-in + acknowledge flow, tree rollup end to end.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GoalsService, type CreateGoalInput } from "./service.ts";
import { DomainError, type Timeframe } from "./types.ts";

const tf: Timeframe = { type: "quarter", startDate: "2026-01-01", endDate: "2026-03-31" };

function setup() {
  let clock = new Date("2026-01-01T00:00:00Z");
  const svc = new GoalsService({ now: () => clock });
  svc.addSpace({ id: "growth", name: "Growth", memberIds: ["champ", "rev", "member"] });
  const base: CreateGoalInput = {
    name: "Grow MRR",
    spaceId: "growth",
    championId: "champ",
    reviewerId: "rev",
    timeframe: tf,
  };
  return { svc, base, tick: (d: string) => (clock = new Date(d)) };
}

test("createGoal enforces space membership", () => {
  const { svc, base } = setup();
  assert.throws(
    () => svc.createGoal("stranger", base),
    (e: unknown) => e instanceof DomainError && e.code === "forbidden",
  );
  const goal = svc.createGoal("champ", base);
  assert.equal(goal.status, "active");
  assert.equal(goal.cadenceDays, 30);
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
        timeframe: { type: "custom", startDate: "2026-03-01", endDate: "2026-01-01" },
      }),
    (e: unknown) => e instanceof DomainError && e.code === "invalid_timeframe",
  );
});

test("setParent refuses cycles", () => {
  const { svc, base } = setup();
  const a = svc.createGoal("champ", base);
  const b = svc.createGoal("champ", { ...base, parentId: a.id });
  assert.throws(
    () => svc.setParent("champ", a.id, b.id), // a under b, but b already under a
    (e: unknown) => e instanceof DomainError && e.code === "parent_cycle",
  );
});

test("only champion adds/updates targets; progress recomputes", () => {
  const { svc, base } = setup();
  const goal = svc.createGoal("champ", base);
  assert.throws(
    () => svc.addTarget("member", goal.id, { name: "MRR", unit: "currency", fromValue: 0, toValue: 100 }),
    (e: unknown) => e instanceof DomainError && e.code === "forbidden",
  );
  const t = svc.addTarget("champ", goal.id, { name: "MRR", unit: "currency", fromValue: 0, toValue: 100 });
  svc.updateTargetValue("champ", t.id, 45);
  assert.equal(svc.targetsFor(goal.id)[0]!.currentValue, 45);
});

test("close state machine: pending until reviewer approves; non-reviewer 403", () => {
  const { svc, base } = setup();
  const goal = svc.createGoal("champ", base);
  const pending = svc.requestClose("champ", goal.id, "achieved");
  assert.equal(pending.status, "pending_close");
  // a non-reviewer cannot approve
  assert.throws(
    () => svc.approveClose("member", goal.id),
    (e: unknown) => e instanceof DomainError && e.code === "not_reviewer",
  );
  assert.equal(svc.getGoal(goal.id)!.status, "pending_close"); // still not closed
  const closed = svc.approveClose("rev", goal.id);
  assert.equal(closed.status, "closed");
  assert.equal(closed.outcome, "achieved");
});

test("check-in flow: champion checks in, off_track needs a reason, reviewer acknowledges", () => {
  const { svc, base, tick } = setup();
  const goal = svc.createGoal("champ", base);
  const t = svc.addTarget("champ", goal.id, { name: "MRR", unit: "number", fromValue: 0, toValue: 100 });

  // off_track with no reason is rejected
  assert.throws(
    () =>
      svc.createCheckIn("champ", goal.id, {
        status: "off_track",
        narrative: { wins: "", obstacles: "", needs: "" },
      }),
    (e: unknown) => e instanceof DomainError && e.code === "reason_required",
  );

  tick("2026-02-01T00:00:00Z");
  const ci = svc.createCheckIn("champ", goal.id, {
    status: "caution",
    narrative: { wins: "signups up", obstacles: "churn", needs: "hire" },
    targetUpdates: [{ targetId: t.id, currentValue: 40 }],
  });
  assert.equal(ci.targetSnapshots[0]!.progress, 40); // snapshot captured the update
  assert.equal(svc.targetsFor(goal.id)[0]!.currentValue, 40);

  // non-reviewer cannot acknowledge
  assert.throws(
    () => svc.acknowledgeCheckIn("member", ci.id),
    (e: unknown) => e instanceof DomainError && e.code === "not_reviewer",
  );
  const acked = svc.acknowledgeCheckIn("rev", ci.id, "keep going");
  assert.equal(acked.acknowledgedBy, "rev");
  assert.equal(acked.reviewerComment, "keep going");
});

test("overdueGoals surfaces active goals past cadence, excludes paused", () => {
  const { svc, base, tick } = setup();
  const goal = svc.createGoal("champ", base); // activated 2026-01-01, cadence 30d
  tick("2026-02-15T00:00:00Z");
  assert.deepEqual(svc.overdueGoals().map((g) => g.id), [goal.id]);
  svc.pauseGoal("champ", goal.id);
  assert.deepEqual(svc.overdueGoals(), []);
});

test("getGoalTree rolls up a company→space→goal hierarchy with filtering", () => {
  const { svc, base } = setup();
  const company = svc.createGoal("champ", { ...base, name: "Company" });
  const child = svc.createGoal("champ", { ...base, name: "Child", parentId: company.id });
  const tc = svc.addTarget("champ", child.id, { name: "kr", unit: "percent", fromValue: 0, toValue: 100 });
  svc.updateTargetValue("champ", tc.id, 60);

  const tree = svc.getGoalTree({ spaceId: "growth" });
  const root = tree.find((n) => n.id === company.id)!;
  assert.equal(root.rollup.progress, 60); // rolled up from child
  assert.equal(root.children[0]!.progress, 60);

  // filter to a champion that owns nothing → empty forest
  assert.deepEqual(svc.getGoalTree({ championId: "nobody" }), []);
});
