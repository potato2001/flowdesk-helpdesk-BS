import type { TicketDTO } from "../../dto/ticket.dto";
import { toTicketDTO } from "../../mappers/ticket.mapper";
import type { ListTicketsUseCase } from "../../ports/in/tickets";
import type { TicketRepository } from "../../ports/out/repositories";
import type { Clock } from "../../ports/out/services";
import { scopeFor } from "@/domain/ticket/ticket-access";
import type { User } from "@/domain/user/user";

const LIST_LIMIT = 200;

export class ListTickets implements ListTicketsUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor }: { actor: User }): Promise<TicketDTO[]> {
    const now = this.clock.now();
    const rows = await this.tickets.listForScope(scopeFor(actor), LIST_LIMIT);
    return rows.map((ticket) => toTicketDTO(ticket, now));
  }
}
