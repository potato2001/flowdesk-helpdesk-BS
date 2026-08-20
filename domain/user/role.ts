export const ROLES = ["REQUESTER", "AGENT", "MANAGER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = {
  REQUESTER: 0,
  AGENT: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function atLeast(role: Role, minimum: Role) {
  return RANK[role] >= RANK[minimum];
}

/** Only Manager and Admin may route a ticket to an assignee. */
export function canAssignTickets(role: Role) {
  return atLeast(role, "MANAGER");
}

/** Requesters must never see or author internal notes. */
export function canWriteInternalNotes(role: Role) {
  return role !== "REQUESTER";
}

/** Staff roles may act on tickets they did not raise. */
export function isStaff(role: Role) {
  return atLeast(role, "AGENT");
}
