// Spec 0011 — cadence/overdue, off-track reason gate, snapshots.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isCheckInOverdue,
  offTrackNeedsReason,
  snapshotTargets,
  worseStatus,
} from "./checkin.ts";
import type { CheckIn, Goal, Target, Timeframe } from "./types.ts";

const tf: Timeframe = { type: "quarter", startDate: "2026-01-01", endDate: "2026-03-31" };
const goal = (o: Partial<Goal> = {}): Goal => ({
  id: "g",
  name: "g",
  spaceId: "s",
  championId: "c",
  reviewerId: "r",
  timeframe: tf,
  parentId: null,
  status: "active",
  cadenceDays: 30,
  activatedAt: "2026-01-01T00:00:00.000Z",
  ...o,
});

test("active goal past cadence with no check-in is overdue", () => {
  assert.equal(isCheckInOverdue(goal(), [], new Date("2026-02-15T00:00:00Z")), true);
  assert.equal(isCheckInOverdue(goal(), [], new Date("2026-01-20T00:00:00Z")), false);
});

test("recent check-in resets the overdue window", () => {
  const ci: CheckIn = {
    id: "ci",
    goalId: "g",
    authorId: "c",
    status: "on_track",
    narrative: { wins: "", obstacles: "", needs: "" },
    targetSnapshots: [],
    createdAt: "2026-02-10T00:00:00.000Z",
  };
  assert.equal(isCheckInOverdue(goal(), [ci], new Date("2026-02-20T00:00:00Z")), false);
  assert.equal(isCheckInOverdue(goal(), [ci], new Date("2026-03-20T00:00:00Z")), true);
});

test("paused / closed goals are never overdue", () => {
  const late = new Date("2026-06-01T00:00:00Z");
  assert.equal(isCheckInOverdue(goal({ status: "paused" }), [], late), false);
  assert.equal(isCheckInOverdue(goal({ status: "closed" }), [], late), false);
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

test("snapshotTargets records current value + computed progress", () => {
  const targets: Target[] = [
    { id: "t1", goalId: "g", name: "t", unit: "number", fromValue: 0, toValue: 100, currentValue: 40 },
  ];
  assert.deepEqual(snapshotTargets(targets), [
    { targetId: "t1", currentValue: 40, progress: 40 },
  ]);
});
