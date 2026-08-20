export const TICKET_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "WAITING",
  "RESOLVED",
  "CLOSED",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export type Ticket = {
  id: string;
  number: number;
  title: string;
  description: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterId: string;
  assigneeId: string | null;
  responseDueAt: Date;
  resolutionDueAt: Date;
  firstRespondedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
};

/** A ticket is complete once it is resolved or closed; SLA stops counting. */
export function isComplete(status: TicketStatus) {
  return status === "RESOLVED" || status === "CLOSED";
}

/** Moving into a terminal status stamps resolvedAt; moving back clears it. */
export function resolvedAtFor(status: TicketStatus, now: Date): Date | null {
  return isComplete(status) ? now : null;
}
