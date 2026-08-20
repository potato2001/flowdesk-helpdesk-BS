import type {
  ActivityRecord,
  AdminUserView,
  AttachmentWithUploader,
  CommentWithAuthor,
  TicketWithParties,
} from "@/application/ports/out/repositories";
import type { Ticket } from "@/domain/ticket/ticket";
import type { User } from "@/domain/user/user";

/**
 * Prisma rows never leave this layer. Everything above consumes the domain
 * types these functions produce.
 */

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  active: boolean;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  mustChangePassword: boolean;
  passwordChangedAt: Date;
  createdAt: Date;
};

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as User["role"],
    department: row.department,
    active: row.active,
    passwordHash: row.passwordHash,
    failedLoginAttempts: row.failedLoginAttempts,
    lockedUntil: row.lockedUntil,
    mustChangePassword: row.mustChangePassword,
    passwordChangedAt: row.passwordChangedAt,
    createdAt: row.createdAt,
  };
}

export const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  department: true,
  active: true,
  failedLoginAttempts: true,
  lockedUntil: true,
  mustChangePassword: true,
  createdAt: true,
} as const;

type AdminUserRow = Omit<UserRow, "passwordHash" | "passwordChangedAt">;

export function toAdminUserView(row: AdminUserRow): AdminUserView {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as AdminUserView["role"],
    department: row.department,
    active: row.active,
    failedLoginAttempts: row.failedLoginAttempts,
    lockedUntil: row.lockedUntil,
    mustChangePassword: row.mustChangePassword,
    createdAt: row.createdAt,
  };
}

type TicketRow = {
  id: string;
  number: number;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  requesterId: string;
  assigneeId: string | null;
  responseDueAt: Date;
  resolutionDueAt: Date;
  firstRespondedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
};

export function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status as Ticket["status"],
    priority: row.priority as Ticket["priority"],
    requesterId: row.requesterId,
    assigneeId: row.assigneeId,
    responseDueAt: row.responseDueAt,
    resolutionDueAt: row.resolutionDueAt,
    firstRespondedAt: row.firstRespondedAt,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
  };
}

export function toTicketWithParties(
  row: TicketRow & { requester: UserRow; assignee: UserRow | null },
): TicketWithParties {
  return {
    ...toTicket(row),
    requester: toUser(row.requester),
    assignee: row.assignee ? toUser(row.assignee) : null,
  };
}

export function toCommentWithAuthor(
  row: {
    id: string;
    ticketId: string;
    authorId: string;
    body: string;
    visibility: string;
    createdAt: Date;
  } & { author: UserRow },
): CommentWithAuthor {
  return {
    id: row.id,
    ticketId: row.ticketId,
    authorId: row.authorId,
    body: row.body,
    visibility: row.visibility as CommentWithAuthor["visibility"],
    createdAt: row.createdAt,
    author: toUser(row.author),
  };
}

export function toActivityRecord(
  row: {
    id: string;
    ticketId: string;
    actorId: string | null;
    type: string;
    summary: string;
    createdAt: Date;
  } & { actor: UserRow | null },
): ActivityRecord {
  return {
    id: row.id,
    ticketId: row.ticketId,
    actorId: row.actorId,
    actor: row.actor ? toUser(row.actor) : null,
    type: row.type,
    summary: row.summary,
    createdAt: row.createdAt,
  };
}

export function toAttachmentWithUploader(
  row: {
    id: string;
    ticketId: string;
    commentId: string | null;
    uploadedById: string;
    fileName: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: Date;
  } & { uploadedBy: UserRow },
): AttachmentWithUploader {
  return {
    id: row.id,
    ticketId: row.ticketId,
    commentId: row.commentId,
    uploadedById: row.uploadedById,
    fileName: row.fileName,
    storageKey: row.storageKey,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
    uploadedBy: toUser(row.uploadedBy),
  };
}
