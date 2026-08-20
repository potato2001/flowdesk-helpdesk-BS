import type {
  ActivityDTO,
  AttachmentDTO,
  CommentDTO,
  TicketDTO,
  UiTicketPriority,
  UiTicketStatus,
} from "../dto/ticket.dto";
import type {
  ActivityRecord,
  AttachmentWithUploader,
  CommentWithAuthor,
  TicketDetail,
  TicketWithParties,
} from "../ports/out/repositories";
import { isComplete, type TicketPriority, type TicketStatus } from "@/domain/ticket/ticket";
import { remainingMinutes } from "@/domain/ticket/sla";
import { formatTicketRef } from "@/domain/ticket/ticket-ref";
import { initialsOf } from "@/domain/user/user";

/**
 * The UI works with a coarser vocabulary than the domain: CLOSED reads as
 * resolved, URGENT reads as high. Collapsing happens once, here.
 */
const STATUS_TO_UI: Record<TicketStatus, UiTicketStatus> = {
  NEW: "new",
  IN_PROGRESS: "progress",
  WAITING: "waiting",
  RESOLVED: "resolved",
  CLOSED: "resolved",
};

const PRIORITY_TO_UI: Record<TicketPriority, UiTicketPriority> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "high",
};

export function toCommentDTO(comment: CommentWithAuthor): CommentDTO {
  return {
    id: comment.id,
    author: comment.author.name,
    initials: initialsOf(comment.author.name),
    body: comment.body,
    time: comment.createdAt.toISOString(),
    internal: comment.visibility === "INTERNAL",
  };
}

export function toActivityDTO(activity: ActivityRecord): ActivityDTO {
  return {
    id: activity.id,
    text: activity.summary,
    actor: activity.actor?.name ?? "Hệ thống",
    time: activity.createdAt.toISOString(),
  };
}

export function toAttachmentDTO(file: AttachmentWithUploader): AttachmentDTO {
  return {
    id: file.id,
    name: file.fileName,
    sizeBytes: file.sizeBytes,
    author: file.uploadedBy.name,
    time: file.createdAt.toISOString(),
    downloadUrl: `/api/attachments/${file.id}`,
  };
}

export function toTicketDTO(
  ticket: TicketWithParties | TicketDetail,
  now: Date,
  comments: readonly CommentWithAuthor[] = [],
): TicketDTO {
  const detail = ticket as Partial<TicketDetail>;
  const complete = isComplete(ticket.status);
  return {
    databaseId: ticket.id,
    id: formatTicketRef(ticket.number),
    title: ticket.title,
    description: ticket.description,
    requester: ticket.requester.name,
    requesterEmail: ticket.requester.email,
    department: ticket.requester.department ?? "Chưa xác định",
    status: STATUS_TO_UI[ticket.status],
    priority: PRIORITY_TO_UI[ticket.priority],
    category: ticket.category,
    assignee: ticket.assignee?.name ?? "Chưa phân công",
    assigneeId: ticket.assigneeId,
    initials: ticket.assignee ? initialsOf(ticket.assignee.name) : "--",
    responseSla: remainingMinutes(
      ticket.responseDueAt,
      now,
      Boolean(ticket.firstRespondedAt),
    ),
    resolutionSla: remainingMinutes(ticket.resolutionDueAt, now, complete),
    createdAt: ticket.createdAt.toISOString(),
    comments: comments.map(toCommentDTO),
    activities: (detail.activities ?? []).map(toActivityDTO),
    attachments: (detail.attachments ?? []).map(toAttachmentDTO),
  };
}
