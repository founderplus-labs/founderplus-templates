// Goal checklist "checks" (Operately Goals.Check).
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeChecksProgress, nextCheckIndex } from "./checks.ts";
import type { GoalCheck } from "./types.ts";

const c = (index: number, completed: boolean): GoalCheck => ({
  id: `c${index}`,
  goalId: "g",
  creatorId: "u",
  name: `c${index}`,
  completed,
  index,
});

test("checklist progress is done/total", () => {
  assert.equal(computeChecksProgress([c(0, true), c(1, false), c(2, true), c(3, false)]), 50);
  assert.equal(computeChecksProgress([c(0, true), c(1, true)]), 100);
});

test("empty checklist is unmeasured (null)", () => {
  assert.equal(computeChecksProgress([]), null);
});

test("nextCheckIndex appends after the highest index", () => {
  assert.equal(nextCheckIndex([]), 0);
  assert.equal(nextCheckIndex([c(0, false), c(1, false)]), 2);
});
