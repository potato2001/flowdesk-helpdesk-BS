import { HttpError } from "./http";
import { canAccessTicket, type AppRole } from "./auth";
import type { Prisma } from "../generated/prisma/client";

type TicketCore = Prisma.TicketGetPayload<{ include: { requester: true; assignee: true } }>;
type CommentWithAuthor = Prisma.CommentGetPayload<{ include: { author: true } }>;
type ActivityWithActor = Prisma.ActivityGetPayload<{ include: { actor: true } }>;
type AttachmentWithUploader = Prisma.AttachmentGetPayload<{ include: { uploadedBy: true } }>;
type SerializableTicket = TicketCore & { comments?: CommentWithAuthor[]; activities?: ActivityWithActor[]; attachments?: AttachmentWithUploader[] };

const statusToUi = {
  NEW: "new",
  IN_PROGRESS: "progress",
  WAITING: "waiting",
  RESOLVED: "resolved",
  CLOSED: "resolved",
} as const;
const priorityToUi = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "high",
} as const;

export function remainingMinutes(date: Date, complete = false) {
  return complete
    ? 0
    : Math.max(0, Math.ceil((date.getTime() - Date.now()) / 60_000));
}

export function serializeTicket(ticket: SerializableTicket) {
  const complete = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  return {
    databaseId: ticket.id,
    id: `HD-${ticket.number}`,
    title: ticket.title,
    description: ticket.description,
    requester: ticket.requester.name,
    requesterEmail: ticket.requester.email,
    department: ticket.requester.department ?? "Chưa xác định",
    status: statusToUi[ticket.status as keyof typeof statusToUi],
    priority: priorityToUi[ticket.priority as keyof typeof priorityToUi],
    category: ticket.category,
    assignee: ticket.assignee?.name ?? "Chưa phân công",
    assigneeId: ticket.assigneeId,
    initials: ticket.assignee
      ? ticket.assignee.name
          .split(/\s+/)
          .slice(-2)
          .map((part: string) => part[0])
          .join("")
          .toUpperCase()
      : "--",
    responseSla: remainingMinutes(
      ticket.responseDueAt,
      Boolean(ticket.firstRespondedAt),
    ),
    resolutionSla: remainingMinutes(ticket.resolutionDueAt, complete),
    createdAt: ticket.createdAt,
    comments:
      ticket.comments?.map((comment) => ({
        id: comment.id,
        author: comment.author.name,
        initials: comment.author.name
          .split(/\s+/)
          .slice(-2)
          .map((part: string) => part[0])
          .join("")
          .toUpperCase(),
        body: comment.body,
        time: comment.createdAt,
        internal: comment.visibility === "INTERNAL",
      })) ?? [],
    activities:
      ticket.activities?.map((activity) => ({
        id: activity.id,
        text: activity.summary,
        actor: activity.actor?.name ?? "Hệ thống",
        time: activity.createdAt,
      })) ?? [],
    attachments:
      ticket.attachments?.map((file) => ({
        id: file.id,
        name: file.fileName,
        sizeBytes: file.sizeBytes,
        author: file.uploadedBy.name,
        time: file.createdAt,
        downloadUrl: `/api/attachments/${file.id}`,
      })) ?? [],
  };
}

export function assertTicketAccess(
  user: { id: string; role: AppRole },
  ticket: { requesterId: string; assigneeId: string | null } | null,
) {
  if (!ticket) throw new HttpError(404, "Không tìm thấy ticket.");
  if (!canAccessTicket(user, ticket))
    throw new HttpError(403, "Bạn không có quyền xem ticket này.");
}
