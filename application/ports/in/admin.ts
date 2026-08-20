import type { PageMetaDTO, SlaPolicyDTO } from "../../dto/admin.dto";
import type { AdminUserDTO, AssignableUserDTO, AuditLogDTO } from "../../dto/user.dto";
import type { TicketPriority } from "@/domain/ticket/ticket";
import type { Role } from "@/domain/user/role";
import type { User } from "@/domain/user/user";

export type PageQuery = { page?: number; pageSize?: number };

export type ListUsersInput = PageQuery & {
  actor: User;
  search?: string;
  role?: Role;
  active?: boolean;
};

export interface ListUsersUseCase {
  execute(
    input: ListUsersInput,
  ): Promise<{ users: AdminUserDTO[]; meta: PageMetaDTO }>;
}

export type CreateUserInput = {
  actor: User;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  temporaryPassword: string;
  ipAddress: string | null;
};

export interface CreateUserUseCase {
  execute(input: CreateUserInput): Promise<AdminUserDTO>;
}

export type UpdateUserInput = {
  actor: User;
  targetId: string;
  name?: string;
  role?: Role;
  department?: string | null;
  active?: boolean;
  unlock?: boolean;
  temporaryPassword?: string;
  ipAddress: string | null;
};

export interface UpdateUserUseCase {
  execute(input: UpdateUserInput): Promise<AdminUserDTO>;
}

export type ListAuditLogsInput = PageQuery & {
  actor: User;
  action?: string;
  actorId?: string;
};

export interface ListAuditLogsUseCase {
  execute(
    input: ListAuditLogsInput,
  ): Promise<{ logs: AuditLogDTO[]; meta: PageMetaDTO; actions: string[] }>;
}

export interface ListSlaPoliciesUseCase {
  execute(input: { actor: User }): Promise<SlaPolicyDTO[]>;
}

export type UpdateSlaPolicyInput = {
  actor: User;
  priority: TicketPriority;
  name?: string;
  responseMinutes?: number;
  resolutionMinutes?: number;
  businessHoursOnly?: boolean;
  active?: boolean;
  ipAddress: string | null;
};

export interface UpdateSlaPolicyUseCase {
  execute(input: UpdateSlaPolicyInput): Promise<SlaPolicyDTO>;
}

export interface ListAssignableUsersUseCase {
  execute(input: { actor: User }): Promise<AssignableUserDTO[]>;
}

export interface CheckHealthUseCase {
  execute(): Promise<{ status: "ok" | "degraded"; database: "connected" | "disconnected" }>;
}
