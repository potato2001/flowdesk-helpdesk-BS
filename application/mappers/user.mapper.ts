import type {
  AdminUserDTO,
  AssignableUserDTO,
  AuditLogDTO,
  SessionUserDTO,
} from "../dto/user.dto";
import type {
  AdminUserView,
  AuditRecord,
  PageMeta,
  SlaPolicyRecord,
  UserSummary,
} from "../ports/out/repositories";
import type { PageMetaDTO, SlaPolicyDTO } from "../dto/admin.dto";
import type { User } from "@/domain/user/user";

export function toSessionUserDTO(user: User): SessionUserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    mustChangePassword: user.mustChangePassword,
  };
}

export function toAssignableUserDTO(user: UserSummary): AssignableUserDTO {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function toAdminUserDTO(user: AdminUserView): AdminUserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    active: user.active,
    failedLoginAttempts: user.failedLoginAttempts,
    lockedUntil: user.lockedUntil?.toISOString() ?? null,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toAuditLogDTO(record: AuditRecord): AuditLogDTO {
  return {
    id: record.id,
    action: record.action,
    targetId: record.targetId,
    createdAt: record.createdAt.toISOString(),
    actor: record.actor
      ? { name: record.actor.name, email: record.actor.email }
      : null,
  };
}

export function toPageMetaDTO(meta: PageMeta): PageMetaDTO {
  return {
    page: meta.page,
    pageSize: meta.pageSize,
    total: meta.total,
    totalPages: meta.totalPages,
  };
}

export function toSlaPolicyDTO(policy: SlaPolicyRecord): SlaPolicyDTO {
  return {
    id: policy.id,
    name: policy.name,
    priority: policy.priority,
    responseMinutes: policy.responseMinutes,
    resolutionMinutes: policy.resolutionMinutes,
    businessHoursOnly: policy.businessHoursOnly,
    active: policy.active,
    updatedAt: policy.updatedAt.toISOString(),
  };
}
