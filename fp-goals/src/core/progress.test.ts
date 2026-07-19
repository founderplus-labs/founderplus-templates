// Spec 0010 — target progress, goal rollup, value formatting.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeGoalProgress,
  computeTargetProgress,
  formatTargetValue,
  isTargetDone,
  targetProgressPercentage,
} from "./progress.ts";
import type { Target } from "./types.ts";

const T = (o: Partial<Target>): Target => ({
  id: "t",
  goalId: "g",
  name: "t",
  unit: "number",
  from: 0,
  to: 100,
  value: 0,
  index: 0,
  ...o,
});

test("progress up: 0→100, value 60 = 60%", () => {
  assert.equal(computeTargetProgress(0, 100, 60), 60);
});

test("progress down: 20→5, value 12 = 53%", () => {
  assert.equal(computeTargetProgress(20, 5, 12), 53);
});

test("value beyond target is clamped to 100 (and never below 0)", () => {
  assert.equal(computeTargetProgress(0, 100, 140), 100);
  assert.equal(computeTargetProgress(0, 100, -20), 0);
  assert.equal(computeTargetProgress(20, 5, 2), 100); // overshoot on a down target
});

test("from === to: no div-by-zero — reached=100 else 0", () => {
  assert.equal(computeTargetProgress(5, 5, 5), 100);
  assert.equal(computeTargetProgress(5, 5, 4), 0);
});

test("isTargetDone true only at 100%", () => {
  assert.equal(isTargetDone(T({ value: 100 })), true);
  assert.equal(isTargetDone(T({ value: 99 })), false);
});

test("formatTargetValue honours unit", () => {
  assert.equal(formatTargetValue("percent", 62), "62%");
  assert.equal(formatTargetValue("currency", 99000), "Rp 99.000");
  assert.equal(formatTargetValue("boolean", 1), "Yes");
  assert.equal(formatTargetValue("number", 12), "12");
});

test("goal progress is simple average by default", () => {
  assert.equal(computeGoalProgress([T({ value: 100 }), T({ value: 0 })]), 50);
});

test("goal progress honours target weights", () => {
  const p = computeGoalProgress([
    T({ value: 100, weight: 3 }),
    T({ value: 0, weight: 1 }),
  ]);
  assert.equal(p, 75);
});

test("goal with no targets is unmeasured (null), not a false 0%", () => {
  assert.equal(computeGoalProgress([]), null);
});

test("targetProgressPercentage reads a Target record", () => {
  assert.equal(targetProgressPercentage(T({ from: 0, to: 200, value: 50 })), 25);
});
