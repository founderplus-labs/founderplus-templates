// Spec 0012 — alignment tree rollup: weighted progress, worst-wins status,
// unmeasured not dragging, orphan-becomes-root under filtering.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGoalTree } from "./tree.ts";
import type { CheckIn, Goal, Target, Timeframe } from "./types.ts";

const tf: Timeframe = { type: "quarter", startDate: "2026-01-01", endDate: "2026-03-31" };
const g = (id: string, parentId: string | null, o: Partial<Goal> = {}): Goal => ({
  id,
  name: id,
  spaceId: "s",
  championId: "c",
  reviewerId: "r",
  timeframe: tf,
  parentId,
  status: "active",
  cadenceDays: 30,
  ...o,
});
const tgt = (goalId: string, current: number, weight = 1): Target => ({
  id: `${goalId}-t-${current}-${weight}`,
  goalId,
  name: "t",
  unit: "number",
  fromValue: 0,
  toValue: 100,
  currentValue: current,
  weight,
});
const ci = (goalId: string, status: CheckIn["status"]): CheckIn => ({
  id: `${goalId}-ci`,
  goalId,
  authorId: "c",
  status,
  narrative: { wins: "", obstacles: "x", needs: "x" },
  targetSnapshots: [],
  createdAt: "2026-02-01T00:00:00.000Z",
});

test("parent rolls up weighted child progress", () => {
  // parent P (no own targets) with children A(100%, w3) and B(0%, w1) → 75
  const goals = [g("P", null), g("A", "P", { weight: 3 }), g("B", "P", { weight: 1 })];
  const targetsByGoal = new Map([
    ["A", [tgt("A", 100)]],
    ["B", [tgt("B", 0)]],
  ]);
  const tree = buildGoalTree(goals, { targetsByGoal, checkInsByGoal: new Map() });
  const p = tree.find((n) => n.id === "P")!;
  assert.equal(p.rollup.progress, 75);
  assert.equal(p.rollup.childCount, 2);
  assert.equal(p.progress, null); // P has no own targets
});

test("unmeasured child does not drag rollup to a false 0%", () => {
  // A measured 80%, B unmeasured (no targets) → rollup = 80, not 40
  const goals = [g("P", null), g("A", "P"), g("B", "P")];
  const targetsByGoal = new Map([["A", [tgt("A", 80)]]]);
  const tree = buildGoalTree(goals, { targetsByGoal, checkInsByGoal: new Map() });
  const p = tree.find((n) => n.id === "P")!;
  assert.equal(p.rollup.progress, 80);
});

test("status rolls up worst-wins over the subtree", () => {
  const goals = [g("P", null), g("A", "P"), g("B", "P")];
  const checkInsByGoal = new Map([
    ["P", [ci("P", "on_track")]],
    ["A", [ci("A", "caution")]],
    ["B", [ci("B", "off_track")]],
  ]);
  const tree = buildGoalTree(goals, { targetsByGoal: new Map(), checkInsByGoal });
  const p = tree.find((n) => n.id === "P")!;
  assert.equal(p.status, "on_track"); // own status
  assert.equal(p.rollup.status, "off_track"); // worst descendant wins
});

test("paused goal reports paused health, excluded from worst-wins", () => {
  const goals = [g("P", null), g("A", "P", { status: "paused" })];
  const checkInsByGoal = new Map([["P", [ci("P", "on_track")]]]);
  const tree = buildGoalTree(goals, { targetsByGoal: new Map(), checkInsByGoal });
  const p = tree.find((n) => n.id === "P")!;
  const a = p.children[0]!;
  assert.equal(a.status, "paused");
  assert.equal(p.rollup.status, "on_track"); // paused child does not worsen it
});

test("a goal whose parent is filtered out becomes a root", () => {
  // Only pass the child B (parent A absent) → B is a root, not dropped.
  const tree = buildGoalTree([g("B", "A")], {
    targetsByGoal: new Map(),
    checkInsByGoal: new Map(),
  });
  assert.equal(tree.length, 1);
  assert.equal(tree[0]!.id, "B");
});
