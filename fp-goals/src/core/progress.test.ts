// Spec 0010 — target progress & goal rollup.
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeGoalProgress, computeTargetProgress } from "./progress.ts";
import type { Target } from "./types.ts";

const T = (o: Partial<Target>): Target => ({
  id: "t",
  goalId: "g",
  name: "t",
  unit: "number",
  fromValue: 0,
  toValue: 100,
  currentValue: 0,
  ...o,
});

test("progress up: 0→100, current 60 = 60%", () => {
  assert.equal(computeTargetProgress(0, 100, 60), 60);
});

test("progress down: 20→5, current 12 = 53%", () => {
  assert.equal(computeTargetProgress(20, 5, 12), 53);
});

test("current beyond target is clamped to 100 (and never below 0)", () => {
  assert.equal(computeTargetProgress(0, 100, 140), 100);
  assert.equal(computeTargetProgress(0, 100, -20), 0);
  assert.equal(computeTargetProgress(20, 5, 2), 100); // overshoot on a down target
});

test("from === to: no div-by-zero — reached=100 else 0", () => {
  assert.equal(computeTargetProgress(5, 5, 5), 100);
  assert.equal(computeTargetProgress(5, 5, 4), 0);
});

test("goal progress is simple average by default", () => {
  const p = computeGoalProgress([
    T({ currentValue: 100 }), // 100%
    T({ currentValue: 0 }), // 0%
  ]);
  assert.equal(p, 50);
});

test("goal progress honours target weights", () => {
  const p = computeGoalProgress([
    T({ currentValue: 100, weight: 3 }), // 100% *3
    T({ currentValue: 0, weight: 1 }), // 0% *1
  ]);
  assert.equal(p, 75);
});

test("goal with no targets is unmeasured (null), not a false 0%", () => {
  assert.equal(computeGoalProgress([]), null);
});
