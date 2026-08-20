import type { AttachmentDTO } from "../../dto/ticket.dto";
import { toAttachmentDTO } from "../../mappers/ticket.mapper";
import type {
  AddAttachmentInput,
  AddAttachmentUseCase,
} from "../../ports/in/tickets";
import type {
  AttachmentRepository,
  TicketRepository,
} from "../../ports/out/repositories";
import type { FileStorage, TokenGenerator } from "../../ports/out/services";
import { assertUploadSize, storageKeyFor } from "@/domain/ticket/attachment";
import { assertTicketAccess } from "@/domain/ticket/ticket-access";
import { parseTicketRef } from "@/domain/ticket/ticket-ref";

export class AddAttachment implements AddAttachmentUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly attachments: AttachmentRepository,
    private readonly storage: FileStorage,
    private readonly tokens: TokenGenerator,
  ) {}

  async execute(input: AddAttachmentInput): Promise<AttachmentDTO> {
    assertUploadSize(input.content.byteLength);

    const ticket = await this.tickets.findByNumber(parseTicketRef(input.ref));
    assertTicketAccess(input.actor, ticket);

    // Write the bytes first: a stored file with no row is recoverable garbage,
    // a row pointing at a missing file is a broken download.
    const storageKey = storageKeyFor(
      ticket.id,
      this.tokens.createId(),
      input.fileName,
    );
    await this.storage.write(storageKey, input.content);

    const attachment = await this.attachments.create(
      {
        ticketId: ticket.id,
        uploadedById: input.actor.id,
        fileName: input.fileName.slice(0, 255),
        storageKey,
        mimeType: input.mimeType || "application/octet-stream",
        sizeBytes: input.content.byteLength,
      },
      `Đã đính kèm ${input.fileName.slice(0, 255)}`,
    );
    return toAttachmentDTO(attachment);
  }
}
