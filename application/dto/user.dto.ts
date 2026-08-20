import type { Role } from "@/domain/user/role";

/** Shapes that cross the application boundary outward. Plain data only. */

export type SessionUserDTO = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  mustChangePassword: boolean;
};

export type AssignableUserDTO = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AdminUserDTO = {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  active: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  mustChangePassword: boolean;
  createdAt: string;
};

export type AuditLogDTO = {
  id: string;
  action: string;
  targetId: string | null;
  createdAt: string;
  actor: { name: string; email: string } | null;
};
