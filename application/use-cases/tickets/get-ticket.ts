import type { TicketDTO } from "../../dto/ticket.dto";
import { toTicketDTO } from "../../mappers/ticket.mapper";
import type { GetTicketUseCase } from "../../ports/in/tickets";
import type { TicketRepository } from "../../ports/out/repositories";
import type { Clock } from "../../ports/out/services";
import { notFound } from "@/domain/errors";
import { visibleTo } from "@/domain/ticket/comment";
import { assertTicketAccess } from "@/domain/ticket/ticket-access";
import { parseTicketRef } from "@/domain/ticket/ticket-ref";
import type { User } from "@/domain/user/user";

export class GetTicket implements GetTicketUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly clock: Clock,
  ) {}

  async execute({
    actor,
    ref,
  }: {
    actor: User;
    ref: string;
  }): Promise<TicketDTO> {
    const detail = await this.tickets.findDetailByNumber(parseTicketRef(ref));
    if (!detail) throw notFound("Không tìm thấy ticket.");
    assertTicketAccess(actor, detail);
    return toTicketDTO(
      detail,
      this.clock.now(),
      visibleTo(actor.role, detail.comments),
    );
  }
}
