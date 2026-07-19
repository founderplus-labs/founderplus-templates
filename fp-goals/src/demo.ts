// End-to-end demo of the OKR core (specs 0009–0012), modelled on Operately.
//   node --experimental-strip-types src/demo.ts
import { GoalsService } from "./core/service.ts";
import { AccessLevel } from "./core/permissions.ts";
import type { GoalTreeNode, Timeframe } from "./core/types.ts";

let clock = new Date("2026-01-01T00:00:00Z");
const svc = new GoalsService({ now: () => clock });
const Q1: Timeframe = { type: "quarter", startDate: "2026-01-01", endDate: "2026-03-31" };

const members = [
  { personId: "founder", accessLevel: AccessLevel.FULL },
  { personId: "lead", accessLevel: AccessLevel.EDIT },
  { personId: "eng", accessLevel: AccessLevel.EDIT },
];
svc.addSpace({ id: "co", companyId: "co", name: "Company", members });
svc.addSpace({ id: "growth", companyId: "co", name: "Growth", members });

// Company objective → two aligned team goals.
const company = svc.createGoal("founder", {
  name: "Reach 1,000 paying founders",
  companyId: "co",
  spaceId: "co",
  championId: "founder",
  reviewerId: "lead",
  timeframe: Q1,
});
const acq = svc.createGoal("lead", {
  name: "Grow new signups",
  companyId: "co",
  spaceId: "growth",
  championId: "lead",
  reviewerId: "founder",
  timeframe: Q1,
  parentId: company.id,
  weight: 2,
});
const ret = svc.createGoal("eng", {
  name: "Reduce churn",
  companyId: "co",
  spaceId: "growth",
  championId: "eng",
  reviewerId: "lead",
  timeframe: Q1,
  parentId: company.id,
  weight: 1,
});

// Key results + a checklist item.
const signups = svc.addTarget("lead", acq.id, { name: "New signups", unit: "number", from: 0, to: 400 });
const churn = svc.addTarget("eng", ret.id, { name: "Monthly churn", unit: "percent", from: 20, to: 5 });
svc.addCheck("eng", ret.id, "Ship onboarding v2");

// A month in: champions check in, reviewers acknowledge, teammates react.
clock = new Date("2026-02-01T00:00:00Z");
const ci1 = svc.createCheckIn("lead", acq.id, {
  status: "on_track",
  message: { wins: "2 channels live", obstacles: "", needs: "" },
  targetUpdates: [{ targetId: signups.id, value: 260 }], // 65%
});
svc.acknowledgeCheckIn("founder", ci1.id);
svc.reactToCheckIn("founder", ci1.id, "🚀");

const ci2 = svc.createCheckIn("eng", ret.id, {
  status: "off_track",
  message: { wins: "", obstacles: "onboarding drop-off", needs: "design help" },
  targetUpdates: [{ targetId: churn.id, value: 17 }], // (20-17)/(20-5)=20%
});
svc.acknowledgeCheckIn("lead", ci2.id);

function render(nodes: GoalTreeNode[], depth = 0): void {
  for (const n of nodes) {
    const pad = "  ".repeat(depth);
    const own = n.progress === null ? "—" : `${n.progress}%`;
    const roll = n.rollup.progress === null ? "—" : `${n.rollup.progress}%`;
    console.log(`${pad}• ${n.name}  [own ${own} · rollup ${roll} · ${n.rollup.status}]`);
    render(n.children, depth + 1);
  }
}

console.log("\nOKR Work Map — Q1 2026\n" + "─".repeat(48));
render(svc.getGoalTree());
console.log("─".repeat(48));
const perms = svc.getPermissions("eng", ret.id);
console.log(`Permissions (eng on "Reduce churn"): checkIn=${perms.canCheckIn} ack=${perms.canAcknowledgeCheckIn}`);
clock = new Date("2026-03-20T00:00:00Z");
console.log("Overdue check-ins as of 2026-03-20:", svc.overdueGoals().map((g) => g.name).join(", ") || "none");
console.log("");
