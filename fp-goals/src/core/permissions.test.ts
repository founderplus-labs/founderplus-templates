// Access levels + role gates (Operately Access.Binding + Goals.Permissions).
import { test } from "node:test";
import assert from "node:assert/strict";
import { AccessLevel, goalPermissions } from "./permissions.ts";
import type { Goal, Timeframe } from "./types.ts";

const tf: Timeframe = { type: "quarter", startDate: "2026-01-01", endDate: "2026-03-31" };
const goal: Goal = {
  id: "g",
  name: "g",
  companyId: "co",
  spaceId: "s",
  parentId: null,
  championId: "champ",
  reviewerId: "rev",
  creatorId: "champ",
  timeframe: tf,
  status: "active",
  cadenceDays: 30,
};

test("access levels gate view/comment/edit/full", () => {
  const viewer = goalPermissions(goal, "someone", AccessLevel.VIEW);
  assert.deepEqual(
    [viewer.canView, viewer.canComment, viewer.canEdit, viewer.hasFullAccess],
    [true, false, false, false],
  );
  const commenter = goalPermissions(goal, "someone", AccessLevel.COMMENT);
  assert.equal(commenter.canComment, true);
  assert.equal(commenter.canEdit, false);
  const editor = goalPermissions(goal, "someone", AccessLevel.EDIT);
  assert.equal(editor.canEdit, true);
  assert.equal(editor.hasFullAccess, false);
  const full = goalPermissions(goal, "someone", AccessLevel.FULL);
  assert.equal(full.hasFullAccess, true);
});

test("champion can check in & request close; reviewer can acknowledge & approve", () => {
  const champ = goalPermissions(goal, "champ", AccessLevel.EDIT);
  assert.equal(champ.canCheckIn, true);
  assert.equal(champ.canRequestClose, true);
  assert.equal(champ.canAcknowledgeCheckIn, false); // champion is not the reviewer
  assert.equal(champ.canApproveClose, false);

  const rev = goalPermissions(goal, "rev", AccessLevel.EDIT);
  assert.equal(rev.canAcknowledgeCheckIn, true);
  assert.equal(rev.canApproveClose, true);
  assert.equal(rev.canCheckIn, false);
});

test("a plain viewer can do none of the ritual actions", () => {
  const p = goalPermissions(goal, "stranger", AccessLevel.VIEW);
  assert.equal(p.canCheckIn, false);
  assert.equal(p.canAcknowledgeCheckIn, false);
  assert.equal(p.canManageTargets, false);
  assert.equal(p.canManageChecks, false);
});

test("full access unlocks ritual actions even without a role", () => {
  const admin = goalPermissions(goal, "admin", AccessLevel.FULL);
  assert.equal(admin.canCheckIn, true);
  assert.equal(admin.canAcknowledgeCheckIn, true);
  assert.equal(admin.canApproveClose, true);
});
