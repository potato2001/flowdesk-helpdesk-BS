import type { TicketDTO } from "../../dto/ticket.dto";
import { toTicketDTO } from "../../mappers/ticket.mapper";
import type {
  UpdateTicketInput,
  UpdateTicketUseCase,
} from "../../ports/in/tickets";
import type { TicketRepository } from "../../ports/out/repositories";
import type { Clock } from "../../ports/out/services";
import { forbidden } from "@/domain/errors";
import { resolvedAtFor } from "@/domain/ticket/ticket";
import { assertTicketAccess } from "@/domain/ticket/ticket-access";
import { parseTicketRef } from "@/domain/ticket/ticket-ref";
import { canAssignTickets } from "@/domain/user/role";

export class UpdateTicket implements UpdateTicketUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateTicketInput): Promise<TicketDTO> {
    const now = this.clock.now();
    const number = parseTicketRef(input.ref);
    const existing = await this.tickets.findByNumber(number);
    assertTicketAccess(input.actor, existing);

    if (input.assigneeId !== undefined && !canAssignTickets(input.actor.role))
      throw forbidden("Chỉ Manager và Admin có thể phân công.");

    const change: {
      status?: UpdateTicketInput["status"];
      assigneeId?: string | null;
      resolvedAt?: Date | null;
    } = {};
    if (input.status) {
      change.status = input.status;
      change.resolvedAt = resolvedAtFor(input.status, now);
    }
    if (input.assigneeId !== undefined) change.assigneeId = input.assigneeId;

    const ticket = await this.tickets.update(number, change, {
      actorId: input.actor.id,
      type: input.status ? "STATUS_CHANGED" : "ASSIGNEE_CHANGED",
      summary: input.status
        ? `Đã chuyển trạng thái sang ${input.status}`
        : "Đã cập nhật người xử lý",
    });
    return toTicketDTO(ticket, now);
  }
}
