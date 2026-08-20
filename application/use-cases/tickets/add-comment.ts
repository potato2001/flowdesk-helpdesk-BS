import type { CommentDTO } from "../../dto/ticket.dto";
import { toCommentDTO } from "../../mappers/ticket.mapper";
import type { AddCommentInput, AddCommentUseCase } from "../../ports/in/tickets";
import type {
  CommentRepository,
  TicketRepository,
} from "../../ports/out/repositories";
import { assertCanWrite, visibilityFor } from "@/domain/ticket/comment";
import { assertTicketAccess } from "@/domain/ticket/ticket-access";
import { parseTicketRef } from "@/domain/ticket/ticket-ref";

export class AddComment implements AddCommentUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly comments: CommentRepository,
  ) {}

  async execute(input: AddCommentInput): Promise<CommentDTO> {
    const visibility = visibilityFor(input.internal);
    assertCanWrite(input.actor.role, visibility);

    const ticket = await this.tickets.findByNumber(parseTicketRef(input.ref));
    assertTicketAccess(input.actor, ticket);

    const comment = await this.comments.create(
      {
        ticketId: ticket.id,
        authorId: input.actor.id,
        body: input.body,
        visibility,
      },
      input.internal ? "Đã thêm ghi chú nội bộ" : "Đã thêm bình luận công khai",
    );
    return toCommentDTO(comment);
  }
}
