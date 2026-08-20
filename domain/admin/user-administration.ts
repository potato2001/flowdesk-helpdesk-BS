import { invalidInput } from "../errors";
import type { Role } from "../user/role";

export type AdministeredUser = {
  id: string;
  role: Role;
  active: boolean;
};

export type UserChange = {
  role?: Role;
  active?: boolean;
};

function demotesOrDisables(target: AdministeredUser, change: UserChange) {
  return (
    change.active === false ||
    (change.role !== undefined && change.role !== target.role)
  );
}

/**
 * Two guards protect the system from being locked out of its own admin panel:
 * an admin may not demote or disable themselves, and the last active admin may
 * not be demoted or disabled by anyone.
 */
export function assertChangeAllowed(
  actor: AdministeredUser,
  target: AdministeredUser,
  change: UserChange,
  activeAdminCount: number,
) {
  if (actor.id === target.id && demotesOrDisables(target, change))
    throw invalidInput("Bạn không thể tự vô hiệu hóa hoặc hạ quyền.");

  if (
    target.role === "ADMIN" &&
    target.active &&
    demotesOrDisables(target, change) &&
    activeAdminCount <= 1
  )
    throw invalidInput("Hệ thống phải còn ít nhất một Admin.");
}

/** Changes that must invalidate every existing session for the target user. */
export function invalidatesSessions(
  target: AdministeredUser,
  change: UserChange & { temporaryPassword?: string },
) {
  return (
    change.active === false ||
    (change.role !== undefined && change.role !== target.role) ||
    Boolean(change.temporaryPassword)
  );
}
