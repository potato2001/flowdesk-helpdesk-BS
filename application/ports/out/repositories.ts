import type { AdministeredUser } from "@/domain/admin/user-administration";
import type { Attachment } from "@/domain/ticket/attachment";
import type { Comment, CommentVisibility } from "@/domain/ticket/comment";
import type { SlaWindow } from "@/domain/ticket/sla";
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
} from "@/domain/ticket/ticket";
import type { TicketScope } from "@/domain/ticket/ticket-access";
import type { Role } from "@/domain/user/role";
import type { User } from "@/domain/user/user";

/**
 * Output ports. The application layer owns these interfaces; infrastructure
 * implements them. Nothing here mentions Prisma, SQL or the filesystem.
 */

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type TicketWithParties = Ticket & {
  requester: User;
  assignee: User | null;
};

export type CommentWithAuthor = Comment & { author: User };

export type ActivityRecord = {
  id: string;
  ticketId: string;
  actorId: string | null;
  actor: User | null;
  type: string;
  summary: string;
  createdAt: Date;
};

export type AttachmentWithUploader = Attachment & { uploadedBy: User };

export type TicketDetail = TicketWithParties & {
  comments: CommentWithAuthor[];
  activities: ActivityRecord[];
  attachments: AttachmentWithUploader[];
};

export type NewTicket = {
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  requesterId: string;
  assigneeId: string | null;
  responseDueAt: Date;
  resolutionDueAt: Date;
  openingSummary: string;
};

export type TicketChange = {
  status?: TicketStatus;
  assigneeId?: string | null;
  resolvedAt?: Date | null;
};

export interface TicketRepository {
  listForScope(scope: TicketScope, limit: number): Promise<TicketWithParties[]>;
  findByNumber(number: number): Promise<Ticket | null>;
  findDetailByNumber(number: number): Promise<TicketDetail | null>;
  create(ticket: NewTicket): Promise<TicketWithParties>;
  update(
    number: number,
    change: TicketChange,
    activity: { actorId: string; type: string; summary: string },
  ): Promise<TicketWithParties>;
}

export type NewUser = {
  email: string;
  name: string;
  role: Role;
  department: string | null;
  passwordHash: string;
  mustChangePassword: boolean;
};

export type UserChangeSet = {
  name?: string;
  role?: Role;
  department?: string | null;
  active?: boolean;
  passwordHash?: string;
  passwordChangedAt?: Date;
  mustChangePassword?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
};

export type AdminUserView = AdministeredUser & {
  email: string;
  name: string;
  department: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  mustChangePassword: boolean;
  createdAt: Date;
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  listAll(): Promise<AdminUserView[]>;
  listPage(
    page: PageRequest,
    filters: UserFilters,
  ): Promise<Page<AdminUserView>>;
  listAssignable(): Promise<UserSummary[]>;
  countActiveAdmins(): Promise<number>;
  create(user: NewUser): Promise<AdminUserView>;
  update(id: string, change: UserChangeSet): Promise<AdminUserView>;
  /** Applies the change and drops the user's sessions in one transaction. */
  updateAndRevokeSessions(
    id: string,
    change: UserChangeSet,
  ): Promise<AdminUserView>;
}

export type SessionRecord = {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
};

export interface SessionRepository {
  create(session: SessionRecord): Promise<void>;
  findUserByTokenHash(tokenHash: string, now: Date): Promise<User | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteForUser(userId: string): Promise<void>;
  deleteExpired(now: Date): Promise<void>;
}

export type AuditEntry = {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata?: Record<string, string | number | boolean | null>;
  ipAddress: string | null;
};

export type AuditRecord = {
  id: string;
  action: string;
  targetId: string | null;
  createdAt: Date;
  actor: { id: string; name: string; email: string } | null;
};

export interface AuditRepository {
  record(entry: AuditEntry): Promise<void>;
  listRecent(limit: number): Promise<AuditRecord[]>;
  listPage(
    page: PageRequest,
    filters: AuditFilters,
  ): Promise<Page<AuditRecord>>;
  /** Distinct action names, for populating the filter dropdown. */
  listActions(): Promise<string[]>;
}

export type NewComment = {
  ticketId: string;
  authorId: string;
  body: string;
  visibility: CommentVisibility;
};

export interface CommentRepository {
  create(comment: NewComment, activitySummary: string): Promise<CommentWithAuthor>;
}

export type NewAttachment = {
  ticketId: string;
  uploadedById: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
};

export interface AttachmentRepository {
  create(
    attachment: NewAttachment,
    activitySummary: string,
  ): Promise<AttachmentWithUploader>;
  findWithTicket(
    id: string,
  ): Promise<(Attachment & { ticket: Ticket }) | null>;
}

export interface SlaPolicyRepository {
  windowFor(priority: TicketPriority): Promise<SlaWindow | null>;
  listAll(): Promise<SlaPolicyRecord[]>;
  findByPriority(priority: TicketPriority): Promise<SlaPolicyRecord | null>;
  update(
    priority: TicketPriority,
    change: SlaPolicyChange,
  ): Promise<SlaPolicyRecord>;
}

export interface HealthRepository {
  ping(): Promise<void>;
}

/**
 * Pagination contract. There was no envelope in this codebase before admin
 * lists needed one, so it is defined here and every paged endpoint returns
 * `{ <plural>: T[], meta: PageMeta }` — the plural key keeps the existing
 * bare-key response style, `meta` carries the counts.
 */
export type PageRequest = {
  page: number;
  pageSize: number;
};

export type PageMeta = PageRequest & {
  total: number;
  totalPages: number;
};

export type Page<T> = {
  items: T[];
  meta: PageMeta;
};

export type UserFilters = {
  search?: string;
  role?: Role;
  active?: boolean;
};

export type AuditFilters = {
  action?: string;
  actorId?: string;
};

export type SlaPolicyRecord = {
  id: string;
  name: string;
  priority: TicketPriority;
  responseMinutes: number;
  resolutionMinutes: number;
  businessHoursOnly: boolean;
  active: boolean;
  updatedAt: Date;
};

export type SlaPolicyChange = {
  name?: string;
  responseMinutes?: number;
  resolutionMinutes?: number;
  businessHoursOnly?: boolean;
  active?: boolean;
};
