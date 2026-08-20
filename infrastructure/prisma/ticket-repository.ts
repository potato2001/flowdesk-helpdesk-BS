import type {
  NewTicket,
  TicketChange,
  TicketDetail,
  TicketRepository,
  TicketWithParties,
} from "@/application/ports/out/repositories";
import type { Ticket } from "@/domain/ticket/ticket";
import type { TicketScope } from "@/domain/ticket/ticket-access";
import { getPrisma } from "./client";
import {
  toActivityRecord,
  toAttachmentWithUploader,
  toCommentWithAuthor,
  toTicket,
  toTicketWithParties,
} from "./mappers";

type WhereClause =
  | Record<string, never>
  | { requesterId: string }
  | { OR: [{ assigneeId: string }, { assigneeId: null }] };

/** Translates the domain scope into a query the store can push down. */
function whereFor(scope: TicketScope): WhereClause {
  if (scope.kind === "requested-by") return { requesterId: scope.userId };
  if (scope.kind === "assigned-to-or-unassigned")
    return { OR: [{ assigneeId: scope.userId }, { assigneeId: null }] };
  return {};
}

export class PrismaTicketRepository implements TicketRepository {
  async listForScope(
    scope: TicketScope,
    limit: number,
  ): Promise<TicketWithParties[]> {
    const rows = await getPrisma().ticket.findMany({
      where: whereFor(scope),
      include: { requester: true, assignee: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toTicketWithParties);
  }

  async findByNumber(number: number): Promise<Ticket | null> {
    const row = await getPrisma().ticket.findUnique({ where: { number } });
    return row ? toTicket(row) : null;
  }

  async findDetailByNumber(number: number): Promise<TicketDetail | null> {
    const row = await getPrisma().ticket.findUnique({
      where: { number },
      include: {
        requester: true,
        assignee: true,
        comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
        activities: {
          include: { actor: true },
          orderBy: { createdAt: "desc" },
        },
        attachments: {
          include: { uploadedBy: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!row) return null;
    return {
      ...toTicketWithParties(row),
      comments: row.comments.map(toCommentWithAuthor),
      activities: row.activities.map(toActivityRecord),
      attachments: row.attachments.map(toAttachmentWithUploader),
    };
  }

  async create(ticket: NewTicket): Promise<TicketWithParties> {
    const row = await getPrisma().ticket.create({
      data: {
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        requesterId: ticket.requesterId,
        assigneeId: ticket.assigneeId,
        responseDueAt: ticket.responseDueAt,
        resolutionDueAt: ticket.resolutionDueAt,
        activities: {
          create: {
            actorId: ticket.requesterId,
            type: "TICKET_CREATED",
            summary: ticket.openingSummary,
          },
        },
      },
      include: { requester: true, assignee: true },
    });
    return toTicketWithParties(row);
  }

  async update(
    number: number,
    change: TicketChange,
    activity: { actorId: string; type: string; summary: string },
  ): Promise<TicketWithParties> {
    const row = await getPrisma().ticket.update({
      where: { number },
      data: {
        ...change,
        activities: {
          create: {
            actorId: activity.actorId,
            type: activity.type as "STATUS_CHANGED" | "ASSIGNEE_CHANGED",
            summary: activity.summary,
          },
        },
      },
      include: { requester: true, assignee: true },
    });
    return toTicketWithParties(row);
  }
}
