import type { PageMetaDTO, SlaPolicyDTO } from "@/application/dto/admin.dto";
import type {
  AdminUserDTO,
  AssignableUserDTO,
  AuditLogDTO,
  SessionUserDTO,
} from "@/application/dto/user.dto";
import type { TicketPriority } from "@/domain/ticket/ticket";
import type { Role } from "@/domain/user/role";
import { request } from "./http";

export function fetchSession(signal?: AbortSignal) {
  return request<{ user: SessionUserDTO }>("/api/auth/me", { signal }).then(
    (data) => data.user,
  );
}

export function login(email: string, password: string) {
  return request<{ user: SessionUserDTO }>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((data) => data.user);
}

export function logout() {
  return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return request<{ success: true }>("/api/auth/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function fetchAssignableUsers(signal?: AbortSignal) {
  return request<{ users: AssignableUserDTO[] }>("/api/users", { signal }).then(
    (data) => data.users,
  );
}

/** Mirrors the server envelope: a plural key plus `meta`. */
export type AdminUserPage = { users: AdminUserDTO[]; meta: PageMetaDTO };
export type AuditLogPage = {
  logs: AuditLogDTO[];
  meta: PageMetaDTO;
  actions: string[];
};

export type AdminUserQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: Role;
  active?: boolean;
};

export type AuditQuery = {
  page?: number;
  pageSize?: number;
  action?: string;
  actorId?: string;
};

function toSearchParams(query: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined && value !== "") params.set(key, String(value));
  const search = params.toString();
  return search ? `?${search}` : "";
}

export function fetchAdminUsers(query: AdminUserQuery, signal?: AbortSignal) {
  return request<AdminUserPage>(
    `/api/admin/users${toSearchParams(query)}`,
    { signal },
  );
}

export function fetchAuditLogs(query: AuditQuery, signal?: AbortSignal) {
  return request<AuditLogPage>(`/api/admin/audit${toSearchParams(query)}`, {
    signal,
  });
}

export function fetchSlaPolicies(signal?: AbortSignal) {
  return request<{ policies: SlaPolicyDTO[] }>("/api/admin/sla", {
    signal,
  }).then((data) => data.policies);
}

export type UpdateSlaPolicyBody = {
  name?: string;
  responseMinutes?: number;
  resolutionMinutes?: number;
  businessHoursOnly?: boolean;
  active?: boolean;
};

export function updateSlaPolicy(
  priority: TicketPriority,
  body: UpdateSlaPolicyBody,
) {
  return request<{ policy: SlaPolicyDTO }>(`/api/admin/sla/${priority}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((data) => data.policy);
}

export type CreateUserBody = {
  name: string;
  email: string;
  department: string | null;
  role: Role;
  temporaryPassword: string;
};

export function createUser(body: CreateUserBody) {
  return request<{ user: AdminUserDTO }>("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((data) => data.user);
}

export type UpdateUserBody = {
  name?: string;
  role?: Role;
  department?: string | null;
  active?: boolean;
  unlock?: boolean;
  temporaryPassword?: string;
};

export function updateUser(id: string, body: UpdateUserBody) {
  return request<{ user: AdminUserDTO }>(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((data) => data.user);
}
