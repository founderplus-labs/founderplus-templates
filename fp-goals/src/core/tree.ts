// Alignment tree + rollup (spec 0012, extended in 0014) — Operately Work Map.
// Goals nest by parentId; projects hang off their goal as leaves. Progress rolls
// up weighted (skipping unmeasured); status rolls up worst-wins.
import type { Goal, GoalTreeNode, Milestone, Project, Target } from "./types.ts";
import { computeGoalProgress } from "./progress.ts";
import { goalHealth, worseStatus } from "./checkin.ts";
import { computeProjectProgress, projectHealth } from "./projects.ts";

export interface TreeContext {
  targetsByGoal: ReadonlyMap<string, Target[]>;
  projectsByGoal?: ReadonlyMap<string, Project[]>;
  milestonesByProject?: ReadonlyMap<string, Milestone[]>;
}

export function buildGoalTree(goals: Goal[], ctx: TreeContext): GoalTreeNode[] {
  const byId = new Map(goals.map((g) => [g.id, g]));
  const childrenOf = new Map<string, Goal[]>();
  const roots: Goal[] = [];
  for (const g of goals) {
    const parent = g.parentId && byId.has(g.parentId) ? g.parentId : null;
    if (parent) {
      const arr = childrenOf.get(parent) ?? [];
      arr.push(g);
      childrenOf.set(parent, arr);
    } else {
      roots.push(g);
    }
  }

  const buildProject = (project: Project): GoalTreeNode => {
    const progress = computeProjectProgress(ctx.milestonesByProject?.get(project.id) ?? []);
    const status = projectHealth(project);
    return {
      id: project.id,
      kind: "project",
      name: project.name,
      status,
      progress,
      rollup: { progress, status, childCount: 0 },
      parentId: project.goalId,
      children: [],
    };
  };

  const build = (goal: Goal): GoalTreeNode => {
    const own = computeGoalProgress(ctx.targetsByGoal.get(goal.id) ?? []);
    const health = goalHealth(goal);
    const childGoals = (childrenOf.get(goal.id) ?? []).map(build);
    const projectNodes = (ctx.projectsByGoal?.get(goal.id) ?? []).map(buildProject);
    const children = [...childGoals, ...projectNodes];

    // Weighted mean of own progress (weight 1) + each child's rollup progress
    // (child goal weight, or 1 for a project). Unmeasured (null) skipped.
    const contribs: Array<{ v: number; w: number }> = [];
    if (own !== null) contribs.push({ v: own, w: 1 });
    for (const c of children) {
      if (c.rollup.progress !== null) {
        const w = c.kind === "goal" ? byId.get(c.id)?.weight ?? 1 : 1;
        contribs.push({ v: c.rollup.progress, w });
      }
    }
    const totalW = contribs.reduce((s, c) => s + c.w, 0);
    const rollupProgress =
      contribs.length && totalW > 0
        ? Math.round(contribs.reduce((s, c) => s + c.v * c.w, 0) / totalW)
        : null;

    let rollupStatus = health;
    for (const c of children) rollupStatus = worseStatus(rollupStatus, c.rollup.status);

    return {
      id: goal.id,
      kind: "goal",
      name: goal.name,
      status: health,
      progress: own,
      rollup: { progress: rollupProgress, status: rollupStatus, childCount: children.length },
      parentId: goal.parentId ?? null,
      children,
    };
  };

  return roots.map(build);
}
