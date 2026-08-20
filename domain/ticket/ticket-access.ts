import { forbidden, notFound } from "../errors";
import type { Role } from "../user/role";

export type TicketOwnership = {
  requesterId: string;
  assigneeId: string | null;
};

export type Actor = { id: string; role: Role };

/**
 * Row-level visibility:
 *  - REQUESTER sees only tickets they raised
 *  - AGENT sees their own queue plus anything unassigned
 *  - MANAGER and ADMIN see everything
 */
export function canAccessTicket(actor: Actor, ticket: TicketOwnership) {
  if (actor.role === "REQUESTER") return ticket.requesterId === actor.id;
  if (actor.role === "AGENT")
    return !ticket.assigneeId || ticket.assigneeId === actor.id;
  return true;
}

export function assertTicketAccess(
  actor: Actor,
  ticket: TicketOwnership | null,
): asserts ticket is TicketOwnership {
  if (!ticket) throw notFound("Không tìm thấy ticket.");
  if (!canAccessTicket(actor, ticket))
    throw forbidden("Bạn không có quyền xem ticket này.");
}

/**
 * The same rule expressed as a list filter, so a query can push it down to the
 * store instead of over-fetching and filtering in memory.
 */
export type TicketScope =
  | { kind: "all" }
  | { kind: "requested-by"; userId: string }
  | { kind: "assigned-to-or-unassigned"; userId: string };

export function scopeFor(actor: Actor): TicketScope {
  if (actor.role === "REQUESTER")
    return { kind: "requested-by", userId: actor.id };
  if (actor.role === "AGENT")
    return { kind: "assigned-to-or-unassigned", userId: actor.id };
  return { kind: "all" };
}
