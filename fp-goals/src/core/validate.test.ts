// Spec 0009 — goal validation: champion≠reviewer, timeframe, anti-cycle.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertChampionReviewerDistinct,
  assertValidTimeframe,
  wouldCreateCycle,
} from "./validate.ts";
import { DomainError, type Goal, type Timeframe } from "./types.ts";

const tf = (o: Partial<Timeframe> = {}): Timeframe => ({
  type: "quarter",
  startDate: "2026-01-01",
  endDate: "2026-03-31",
  ...o,
});

test("champion === reviewer is rejected", () => {
  assert.throws(
    () => assertChampionReviewerDistinct("u1", "u1"),
    (e: unknown) => e instanceof DomainError && e.code === "champion_reviewer_same",
  );
  assert.doesNotThrow(() => assertChampionReviewerDistinct("u1", "u2"));
});

test("timeframe must be valid & start before end", () => {
  assert.doesNotThrow(() => assertValidTimeframe(tf()));
  assert.throws(
    () => assertValidTimeframe(tf({ startDate: "2026-03-31", endDate: "2026-01-01" })),
    (e: unknown) => e instanceof DomainError && e.code === "invalid_timeframe",
  );
  assert.throws(
    () => assertValidTimeframe(tf({ startDate: "not-a-date" })),
    (e: unknown) => e instanceof DomainError && e.code === "invalid_timeframe",
  );
});

test("anti-cycle: self-parent and ancestor loops are detected", () => {
  // a → b → c  (c child of b, b child of a)
  const goals = new Map<string, Goal>();
  const mk = (id: string, parentId: string | null): Goal => ({
    id,
    name: id,
    spaceId: "s",
    championId: "c",
    reviewerId: "r",
    timeframe: tf(),
    parentId,
    status: "active",
    cadenceDays: 30,
  });
  goals.set("a", mk("a", null));
  goals.set("b", mk("b", "a"));
  goals.set("c", mk("c", "b"));

  assert.equal(wouldCreateCycle(goals, "a", "a"), true); // self
  assert.equal(wouldCreateCycle(goals, "a", "c"), true); // a is ancestor of c
  assert.equal(wouldCreateCycle(goals, "c", "a"), false); // legit re-parent
});
