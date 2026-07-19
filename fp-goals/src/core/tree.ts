// Alignment tree + rollup (spec 0012) — Operately Work Map. Build the hierarchy
// from parentId, roll progress up (weighted, skipping unmeasured) and status up
// (worst-wins). Health comes from each goal's denormalised lastUpdateStatus.
import type { Goal, GoalTreeNode, Target } from "./types.ts";
import { computeGoalProgress } from "./progress.ts";
import { goalHealth, worseStatus } from "./checkin.ts";

export interface TreeContext {
  targetsByGoal: ReadonlyMap<string, Target[]>;
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

  const build = (goal: Goal): GoalTreeNode => {
    const targets = ctx.targetsByGoal.get(goal.id) ?? [];
    const own = computeGoalProgress(targets); // number | null
    const health = goalHealth(goal);
    const children = (childrenOf.get(goal.id) ?? []).map(build);

    // Weighted mean of own progress (weight 1) + each child's rollup progress
    // (weight = child goal weight). Unmeasured (null) skipped — never a false 0%.
    const contribs: Array<{ v: number; w: number }> = [];
    if (own !== null) contribs.push({ v: own, w: 1 });
    for (const c of children) {
      if (c.rollup.progress !== null) {
        contribs.push({ v: c.rollup.progress, w: byId.get(c.id)?.weight ?? 1 });
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
