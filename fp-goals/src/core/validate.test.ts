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

const mk = (id: string, parentId: string | null): Goal => ({
  id,
  name: id,
  companyId: "co",
  spaceId: "s",
  parentId,
  championId: "c",
  reviewerId: "r",
  creatorId: "c",
  timeframe: tf(),
  status: "active",
  cadenceDays: 30,
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
  const goals = new Map<string, Goal>();
  goals.set("a", mk("a", null));
  goals.set("b", mk("b", "a"));
  goals.set("c", mk("c", "b"));

  assert.equal(wouldCreateCycle(goals, "a", "a"), true); // self
  assert.equal(wouldCreateCycle(goals, "a", "c"), true); // a is ancestor of c
  assert.equal(wouldCreateCycle(goals, "c", "a"), false); // legit re-parent
});
