// Projects & milestones (Operately Projects.Project/Milestone). A project hangs
// off a goal; its progress is milestones done/total, its health the last check-in.
import type { HealthStatus, Milestone, Project } from "./types.ts";

/** Project progress = completed milestones / total, integer 0..100; null if none. */
export function computeProjectProgress(milestones: Milestone[]): number | null {
  if (milestones.length === 0) return null;
  const done = milestones.filter((m) => m.status === "done").length;
  return Math.round((done / milestones.length) * 100);
}

/** Health of a project for the Work Map: paused, last check-in status, or unmeasured. */
export function projectHealth(project: Project): HealthStatus {
  if (project.status === "paused") return "paused";
  return project.lastCheckInStatus ?? "unmeasured";
}

/** Next index to append a milestone at (stable order). */
export function nextMilestoneIndex(milestones: Milestone[]): number {
  return milestones.reduce((max, m) => Math.max(max, m.index), -1) + 1;
}
