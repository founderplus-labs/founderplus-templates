// End-to-end demo of the OKR core (specs 0009–0012). Run:
//   node --experimental-strip-types src/demo.ts
// Deterministic clock so output is stable.
import { GoalsService } from "./core/service.ts";
import type { GoalTreeNode, Timeframe } from "./core/types.ts";

let clock = new Date("2026-01-01T00:00:00Z");
const svc = new GoalsService({ now: () => clock });
const Q1: Timeframe = { type: "quarter", startDate: "2026-01-01", endDate: "2026-03-31" };

svc.addSpace({ id: "co", name: "Company", memberIds: ["founder", "lead", "eng"] });
svc.addSpace({ id: "growth", name: "Growth", memberIds: ["founder", "lead", "eng"] });

// Company objective → two aligned team goals.
const company = svc.createGoal("founder", {
  name: "Reach 1,000 paying founders",
  spaceId: "co",
  championId: "founder",
  reviewerId: "lead",
  timeframe: Q1,
});
const acq = svc.createGoal("lead", {
  name: "Grow new signups",
  spaceId: "growth",
  championId: "lead",
  reviewerId: "founder",
  timeframe: Q1,
  parentId: company.id,
  weight: 2,
});
const ret = svc.createGoal("eng", {
  name: "Reduce churn",
  spaceId: "growth",
  championId: "eng",
  reviewerId: "lead",
  timeframe: Q1,
  parentId: company.id,
  weight: 1,
});

// Key results.
const signups = svc.addTarget("lead", acq.id, { name: "New signups", unit: "number", fromValue: 0, toValue: 400 });
const churn = svc.addTarget("eng", ret.id, { name: "Monthly churn", unit: "percent", fromValue: 20, toValue: 5 });

// A month in: champions check in, reviewers acknowledge.
clock = new Date("2026-02-01T00:00:00Z");
const ci1 = svc.createCheckIn("lead", acq.id, {
  status: "on_track",
  narrative: { wins: "2 channels live", obstacles: "", needs: "" },
  targetUpdates: [{ targetId: signups.id, currentValue: 260 }], // 65%
});
svc.acknowledgeCheckIn("founder", ci1.id, "great start");

const ci2 = svc.createCheckIn("eng", ret.id, {
  status: "off_track",
  narrative: { wins: "", obstacles: "onboarding drop-off", needs: "design help" },
  targetUpdates: [{ targetId: churn.id, currentValue: 17 }], // (20-17)/(20-5)=20%
});
svc.acknowledgeCheckIn("lead", ci2.id);

// Company view.
const tree = svc.getGoalTree({ spaceId: undefined });

function render(nodes: GoalTreeNode[], depth = 0): void {
  for (const n of nodes) {
    const pad = "  ".repeat(depth);
    const own = n.progress === null ? "—" : `${n.progress}%`;
    const roll = n.rollup.progress === null ? "—" : `${n.rollup.progress}%`;
    console.log(
      `${pad}• ${n.name}  [own ${own} · rollup ${roll} · ${n.rollup.status}]`,
    );
    render(n.children, depth + 1);
  }
}

console.log("\nOKR Work Map — Q1 2026\n" + "─".repeat(48));
render(tree);
console.log("─".repeat(48));
console.log(
  "Overdue check-ins as of 2026-03-20:",
  ((clock = new Date("2026-03-20T00:00:00Z")),
  svc.overdueGoals().map((g) => g.name).join(", ") || "none"),
);
console.log("");
