// Spec 0011 — scheduling/overdue, off-track reason gate, snapshots, severity.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeNextUpdateAt,
  isCheckInOverdue,
  offTrackNeedsReason,
  snapshotChecks,
  snapshotTargets,
  worseStatus,
} from "./checkin.ts";
import type { Goal, GoalCheck, Target, Timeframe } from "./types.ts";

const tf: Timeframe = { type: "quarter", startDate: "2026-01-01", endDate: "2026-03-31" };
const goal = (o: Partial<Goal> = {}): Goal => ({
  id: "g",
  name: "g",
  companyId: "co",
  spaceId: "s",
  parentId: null,
  championId: "c",
  reviewerId: "r",
  creatorId: "c",
  timeframe: tf,
  status: "active",
  cadenceDays: 30,
  activatedAt: "2026-01-01T00:00:00.000Z",
  nextUpdateScheduledAt: "2026-01-31T00:00:00.000Z",
  ...o,
});

test("computeNextUpdateAt adds cadence days", () => {
  assert.equal(
    computeNextUpdateAt("2026-01-01T00:00:00.000Z", 30),
    "2026-01-31T00:00:00.000Z",
  );
});

test("active goal past its scheduled update is overdue", () => {
  assert.equal(isCheckInOverdue(goal(), new Date("2026-02-15T00:00:00Z")), true);
  assert.equal(isCheckInOverdue(goal(), new Date("2026-01-20T00:00:00Z")), false);
});

test("paused / closed goals are never overdue", () => {
  const late = new Date("2026-06-01T00:00:00Z");
  assert.equal(isCheckInOverdue(goal({ status: "paused" }), late), false);
  assert.equal(isCheckInOverdue(goal({ status: "closed" }), late), false);
});

test("off_track check-in must give a reason (obstacles or needs)", () => {
  assert.equal(offTrackNeedsReason("off_track", { obstacles: "", needs: "" }), false);
  assert.equal(offTrackNeedsReason("off_track", { obstacles: "blocked", needs: "" }), true);
  assert.equal(offTrackNeedsReason("on_track", { obstacles: "", needs: "" }), true);
});

test("worseStatus picks the more severe (measured beats unmeasured/paused)", () => {
  assert.equal(worseStatus("on_track", "off_track"), "off_track");
  assert.equal(worseStatus("caution", "on_track"), "caution");
  assert.equal(worseStatus("on_track", "unmeasured"), "on_track");
  assert.equal(worseStatus("paused", "caution"), "caution");
});

test("snapshotTargets records name + value + progress, ordered by index", () => {
  const targets: Target[] = [
    { id: "t2", goalId: "g", name: "b", unit: "number", from: 0, to: 100, value: 40, index: 1 },
    { id: "t1", goalId: "g", name: "a", unit: "number", from: 0, to: 100, value: 90, index: 0 },
  ];
  assert.deepEqual(snapshotTargets(targets), [
    { targetId: "t1", name: "a", value: 90, progress: 90 },
    { targetId: "t2", name: "b", value: 40, progress: 40 },
  ]);
});

test("snapshotChecks records completion, ordered by index", () => {
  const checks: GoalCheck[] = [
    { id: "c1", goalId: "g", creatorId: "c", name: "ship", completed: true, index: 0 },
    { id: "c2", goalId: "g", creatorId: "c", name: "docs", completed: false, index: 1 },
  ];
  assert.deepEqual(snapshotChecks(checks), [
    { checkId: "c1", name: "ship", completed: true },
    { checkId: "c2", name: "docs", completed: false },
  ]);
});
