import type {
  AttachmentDTO,
  AttachmentDownloadDTO,
  CommentDTO,
  TicketDTO,
} from "../../dto/ticket.dto";
import type { TicketPriority, TicketStatus } from "@/domain/ticket/ticket";
import type { User } from "@/domain/user/user";

export interface ListTicketsUseCase {
  execute(input: { actor: User }): Promise<TicketDTO[]>;
}

/**
 * How the ticket's requester is chosen. Staff may raise a ticket for someone
 * else; everyone else always raises it for themselves.
 */
export type RequesterChoice =
  | { kind: "self" }
  | { kind: "existing"; userId: string }
  | { kind: "new"; email: string; name: string; department: string | null };

export type CreateTicketInput = {
  actor: User;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  assigneeId: string | null;
  requester?: RequesterChoice;
};

export interface CreateTicketUseCase {
  execute(input: CreateTicketInput): Promise<TicketDTO>;
}

export interface GetTicketUseCase {
  execute(input: { actor: User; ref: string }): Promise<TicketDTO>;
}

export type UpdateTicketInput = {
  actor: User;
  ref: string;
  status?: TicketStatus;
  assigneeId?: string | null;
};

export interface UpdateTicketUseCase {
  execute(input: UpdateTicketInput): Promise<TicketDTO>;
}

export type AddCommentInput = {
  actor: User;
  ref: string;
  body: string;
  internal: boolean;
};

export interface AddCommentUseCase {
  execute(input: AddCommentInput): Promise<CommentDTO>;
}

export type AddAttachmentInput = {
  actor: User;
  ref: string;
  fileName: string;
  mimeType: string;
  content: Uint8Array;
};

export interface AddAttachmentUseCase {
  execute(input: AddAttachmentInput): Promise<AttachmentDTO>;
}

export interface DownloadAttachmentUseCase {
  execute(input: {
    actor: User;
    attachmentId: string;
  }): Promise<AttachmentDownloadDTO>;
}
