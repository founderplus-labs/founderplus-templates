// Access levels + goal permissions — mirrors Operately Access.Binding thresholds
// and Goals.Permissions, layered with the champion/reviewer role gates that
// Operately applies in its goal operations.
import type { Goal, GoalPermissions } from "./types.ts";

/** Operately Access.Binding levels. */
export const AccessLevel = {
  NONE: 0,
  VIEW: 10,
  COMMENT: 40,
  EDIT: 70,
  FULL: 100,
} as const;

export type AccessLevelValue = (typeof AccessLevel)[keyof typeof AccessLevel];

/**
 * Compute a person's effective permissions on a goal from their access level
 * plus their role (champion/reviewer). Access level gates view/comment/edit/full
 * (Operately Goals.Permissions); champion/reviewer unlock the OKR ritual actions.
 */
export function goalPermissions(
  goal: Goal,
  personId: string,
  accessLevel: number,
): GoalPermissions {
  const canView = accessLevel >= AccessLevel.VIEW;
  const canComment = accessLevel >= AccessLevel.COMMENT;
  const canEdit = accessLevel >= AccessLevel.EDIT;
  const hasFullAccess = accessLevel >= AccessLevel.FULL;

  const isChampion = personId === goal.championId;
  const isReviewer = personId === goal.reviewerId;

  return {
    canView,
    canComment,
    canEdit,
    hasFullAccess,
    // Champion runs check-ins; reviewer (or full access) acknowledges them.
    canCheckIn: isChampion || hasFullAccess,
    canAcknowledgeCheckIn: isReviewer || hasFullAccess,
    // Champion requests close; reviewer (or full access) approves it.
    canRequestClose: isChampion || hasFullAccess,
    canApproveClose: isReviewer || hasFullAccess,
    // Editing targets/checks needs edit access (champion typically has it).
    canManageTargets: canEdit || isChampion,
    canManageChecks: canEdit || isChampion,
  };
}
