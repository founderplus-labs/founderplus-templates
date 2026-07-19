// Spec 0014 — projects & milestones progress/health (Operately Projects).
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeProjectProgress, nextMilestoneIndex, projectHealth } from "./projects.ts";
import type { Milestone, Project, Timeframe } from "./types.ts";

const tf: Timeframe = { type: "quarter", startDate: "2026-01-01", endDate: "2026-03-31" };
const m = (index: number, status: Milestone["status"]): Milestone => ({
  id: `m${index}`,
  projectId: "p",
  title: `m${index}`,
  status,
  index,
});
const project = (o: Partial<Project> = {}): Project => ({
  id: "p",
  goalId: "g",
  companyId: "co",
  spaceId: "s",
  name: "Onboarding v2",
  status: "active",
  championId: "eng",
  reviewerId: "lead",
  timeframe: tf,
  ...o,
});

test("project progress = milestones done / total", () => {
  assert.equal(computeProjectProgress([m(0, "done"), m(1, "pending"), m(2, "done"), m(3, "pending")]), 50);
  assert.equal(computeProjectProgress([m(0, "done")]), 100);
});

test("project with no milestones is unmeasured (null)", () => {
  assert.equal(computeProjectProgress([]), null);
});

test("project health = last check-in status, paused, or unmeasured", () => {
  assert.equal(projectHealth(project()), "unmeasured");
  assert.equal(projectHealth(project({ lastCheckInStatus: "caution" })), "caution");
  assert.equal(projectHealth(project({ status: "paused", lastCheckInStatus: "off_track" })), "paused");
});

test("nextMilestoneIndex appends after the highest", () => {
  assert.equal(nextMilestoneIndex([]), 0);
  assert.equal(nextMilestoneIndex([m(0, "pending"), m(1, "done")]), 2);
});
