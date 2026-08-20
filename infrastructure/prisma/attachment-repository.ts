import type {
  AttachmentRepository,
  AttachmentWithUploader,
  NewAttachment,
} from "@/application/ports/out/repositories";
import type { Attachment } from "@/domain/ticket/attachment";
import type { Ticket } from "@/domain/ticket/ticket";
import { getPrisma } from "./client";
import { toAttachmentWithUploader, toTicket } from "./mappers";

export class PrismaAttachmentRepository implements AttachmentRepository {
  async create(
    attachment: NewAttachment,
    activitySummary: string,
  ): Promise<AttachmentWithUploader> {
    const row = await getPrisma().$transaction(async (tx) => {
      const created = await tx.attachment.create({
        data: attachment,
        include: { uploadedBy: true },
      });
      await tx.activity.create({
        data: {
          ticketId: attachment.ticketId,
          actorId: attachment.uploadedById,
          type: "ATTACHMENT_ADDED",
          summary: activitySummary,
        },
      });
      return created;
    });
    return toAttachmentWithUploader(row);
  }

  async findWithTicket(
    id: string,
  ): Promise<(Attachment & { ticket: Ticket }) | null> {
    const row = await getPrisma().attachment.findUnique({
      where: { id },
      include: { ticket: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      ticketId: row.ticketId,
      commentId: row.commentId,
      uploadedById: row.uploadedById,
      fileName: row.fileName,
      storageKey: row.storageKey,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt,
      ticket: toTicket(row.ticket),
    };
  }
}
