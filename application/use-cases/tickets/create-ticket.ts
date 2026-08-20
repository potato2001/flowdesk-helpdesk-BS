import type { TicketDTO } from "../../dto/ticket.dto";
import { toTicketDTO } from "../../mappers/ticket.mapper";
import type {
  CreateTicketInput,
  CreateTicketUseCase,
  RequesterChoice,
} from "../../ports/in/tickets";
import type {
  AuditRepository,
  SlaPolicyRepository,
  TicketRepository,
  UserRepository,
} from "../../ports/out/repositories";
import type {
  Clock,
  PasswordHasher,
  TokenGenerator,
} from "../../ports/out/services";
import { forbidden, notFound } from "@/domain/errors";
import { deadlinesFrom } from "@/domain/ticket/sla";
import { canAssignTickets } from "@/domain/user/role";
import { normalizeEmail } from "@/domain/user/user";

export class CreateTicket implements CreateTicketUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly slaPolicies: SlaPolicyRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenGenerator,
    private readonly clock: Clock,
  ) {}

  /**
   * Resolves who the ticket belongs to. Only staff may name a different
   * requester; a non-staff actor silently raises it for themselves rather
   * than being able to probe which user ids exist.
   */
  private async resolveRequesterId(
    input: CreateTicketInput,
    choice: RequesterChoice,
  ): Promise<string> {
    if (choice.kind === "self" || !canAssignTickets(input.actor.role))
      return input.actor.id;

    if (choice.kind === "existing") {
      const target = await this.users.findById(choice.userId);
      if (!target || !target.active)
        throw notFound("Không tìm thấy người yêu cầu.");
      return target.id;
    }

    const email = normalizeEmail(choice.email);
    const existing = await this.users.findByEmail(email);
    if (existing) {
      if (!existing.active)
        throw forbidden("Tài khoản này đang bị vô hiệu hóa.");
      return existing.id;
    }
    // Provisioned with an unusable random password: the account exists so the
    // ticket has an owner, but it cannot be signed into until an admin issues
    // a temporary password through the user admin screen.
    const created = await this.users.create({
      email,
      name: choice.name,
      role: "REQUESTER",
      department: choice.department,
      passwordHash: await this.hasher.hash(this.tokens.createToken()),
      mustChangePassword: true,
    });
    await this.audit.record({
      actorId: input.actor.id,
      action: "USER_PROVISIONED_FOR_TICKET",
      targetType: "USER",
      targetId: created.id,
      metadata: { email: created.email },
      ipAddress: null,
    });
    return created.id;
  }

  async execute(input: CreateTicketInput): Promise<TicketDTO> {
    const now = this.clock.now();
    const requesterId = await this.resolveRequesterId(
      input,
      input.requester ?? { kind: "self" },
    );
    const window = await this.slaPolicies.windowFor(input.priority);
    const { responseDueAt, resolutionDueAt } = deadlinesFrom(now, window);

    // Only Manager/Admin may route a ticket on creation; others always
    // create unassigned regardless of what the client sent.
    const assigneeId = canAssignTickets(input.actor.role)
      ? (input.assigneeId ?? null)
      : null;

    const ticket = await this.tickets.create({
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      requesterId,
      assigneeId,
      responseDueAt,
      resolutionDueAt,
      openingSummary: `Ticket được tạo với mức ưu tiên ${input.priority}`,
    });
    return toTicketDTO(ticket, now);
  }
}
