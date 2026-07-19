// Spec 0012 — alignment tree rollup: weighted progress, worst-wins status,
// unmeasured not dragging, orphan-becomes-root under filtering.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGoalTree } from "./tree.ts";
import type { CheckInStatus, Goal, Target, Timeframe } from "./types.ts";

const tf: Timeframe = { type: "quarter", startDate: "2026-01-01", endDate: "2026-03-31" };
const g = (id: string, parentId: string | null, o: Partial<Goal> = {}): Goal => ({
  id,
  name: id,
  companyId: "co",
  spaceId: "s",
  parentId,
  championId: "c",
  reviewerId: "r",
  creatorId: "c",
  timeframe: tf,
  status: "active",
  cadenceDays: 30,
  ...o,
});
const tgt = (goalId: string, value: number, weight = 1): Target => ({
  id: `${goalId}-t-${value}-${weight}`,
  goalId,
  name: "t",
  unit: "number",
  from: 0,
  to: 100,
  value,
  index: 0,
  weight,
});
const withStatus = (id: string, parentId: string | null, s: CheckInStatus): Goal =>
  g(id, parentId, { lastUpdateStatus: s });

test("parent rolls up weighted child progress", () => {
  const goals = [g("P", null), g("A", "P", { weight: 3 }), g("B", "P", { weight: 1 })];
  const targetsByGoal = new Map([
    ["A", [tgt("A", 100)]],
    ["B", [tgt("B", 0)]],
  ]);
  const tree = buildGoalTree(goals, { targetsByGoal });
  const p = tree.find((n) => n.id === "P")!;
  assert.equal(p.rollup.progress, 75);
  assert.equal(p.rollup.childCount, 2);
  assert.equal(p.progress, null); // P has no own targets
});

test("unmeasured child does not drag rollup to a false 0%", () => {
  const goals = [g("P", null), g("A", "P"), g("B", "P")];
  const targetsByGoal = new Map([["A", [tgt("A", 80)]]]);
  const tree = buildGoalTree(goals, { targetsByGoal });
  assert.equal(tree.find((n) => n.id === "P")!.rollup.progress, 80);
});

test("status rolls up worst-wins over the subtree", () => {
  const goals = [
    withStatus("P", null, "on_track"),
    withStatus("A", "P", "caution"),
    withStatus("B", "P", "off_track"),
  ];
  const tree = buildGoalTree(goals, { targetsByGoal: new Map() });
  const p = tree.find((n) => n.id === "P")!;
  assert.equal(p.status, "on_track"); // own status
  assert.equal(p.rollup.status, "off_track"); // worst descendant wins
});

test("paused goal reports paused health, excluded from worst-wins", () => {
  const goals = [withStatus("P", null, "on_track"), g("A", "P", { status: "paused" })];
  const tree = buildGoalTree(goals, { targetsByGoal: new Map() });
  const p = tree.find((n) => n.id === "P")!;
  assert.equal(p.children[0]!.status, "paused");
  assert.equal(p.rollup.status, "on_track"); // paused child does not worsen it
});

test("a goal whose parent is filtered out becomes a root", () => {
  const tree = buildGoalTree([g("B", "A")], { targetsByGoal: new Map() });
  assert.equal(tree.length, 1);
  assert.equal(tree[0]!.id, "B");
});

test("projects appear as leaves and contribute to the goal rollup", () => {
  const goals = [g("G", null)]; // no own targets
  const projectsByGoal = new Map([
    [
      "G",
      [
        {
          id: "P1",
          goalId: "G",
          companyId: "co",
          spaceId: "s",
          name: "proj",
          status: "active" as const,
          championId: "c",
          reviewerId: "r",
          timeframe: tf,
          lastCheckInStatus: "caution" as const,
        },
      ],
    ],
  ]);
  const milestonesByProject = new Map([
    [
      "P1",
      [
        { id: "m1", projectId: "P1", title: "a", status: "done" as const, index: 0 },
        { id: "m2", projectId: "P1", title: "b", status: "pending" as const, index: 1 },
      ],
    ],
  ]);
  const tree = buildGoalTree(goals, { targetsByGoal: new Map(), projectsByGoal, milestonesByProject });
  const node = tree[0]!;
  assert.equal(node.children.length, 1);
  assert.equal(node.children[0]!.kind, "project");
  assert.equal(node.children[0]!.progress, 50); // 1/2 milestones
  assert.equal(node.rollup.progress, 50);
  assert.equal(node.rollup.status, "caution"); // project health worst-wins
});
