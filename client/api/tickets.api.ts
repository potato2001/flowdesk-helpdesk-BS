import type {
  AttachmentDTO,
  CommentDTO,
  TicketDTO,
} from "@/application/dto/ticket.dto";
import type { TicketPriority, TicketStatus } from "@/domain/ticket/ticket";
import { request } from "./http";

/**
 * `signal` is threaded through so TanStack Query can abort in-flight requests
 * when a key changes or a component unmounts (query-cancellation).
 */
export function fetchTickets(signal?: AbortSignal) {
  return request<{ tickets: TicketDTO[] }>("/api/tickets", { signal }).then(
    (data) => data.tickets,
  );
}

export function fetchTicket(ref: string, signal?: AbortSignal) {
  return request<{ ticket: TicketDTO }>(`/api/tickets/${ref}`, { signal }).then(
    (data) => data.ticket,
  );
}

export type CreateTicketBody = {
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  assigneeId: string | null;
};

export function createTicket(body: CreateTicketBody) {
  return request<{ ticket: TicketDTO }>("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((data) => data.ticket);
}

export type UpdateTicketBody = {
  status?: TicketStatus;
  assigneeId?: string | null;
};

export function updateTicket(ref: string, body: UpdateTicketBody) {
  return request<{ ticket: TicketDTO }>(`/api/tickets/${ref}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((data) => data.ticket);
}

export function addComment(ref: string, body: string, internal: boolean) {
  return request<{ comment: CommentDTO }>(`/api/tickets/${ref}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, internal }),
  }).then((data) => data.comment);
}

export function addAttachment(ref: string, file: File) {
  const form = new FormData();
  form.set("file", file);
  return request<{ attachment: AttachmentDTO }>(
    `/api/tickets/${ref}/attachments`,
    { method: "POST", body: form },
  ).then((data) => data.attachment);
}
