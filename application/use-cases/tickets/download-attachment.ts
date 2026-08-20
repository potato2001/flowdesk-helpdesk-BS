import type { AttachmentDownloadDTO } from "../../dto/ticket.dto";
import type { DownloadAttachmentUseCase } from "../../ports/in/tickets";
import type { AttachmentRepository } from "../../ports/out/repositories";
import type { FileStorage } from "../../ports/out/services";
import { forbidden, notFound } from "@/domain/errors";
import { canAccessTicket } from "@/domain/ticket/ticket-access";
import type { User } from "@/domain/user/user";

export class DownloadAttachment implements DownloadAttachmentUseCase {
  constructor(
    private readonly attachments: AttachmentRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute({
    actor,
    attachmentId,
  }: {
    actor: User;
    attachmentId: string;
  }): Promise<AttachmentDownloadDTO> {
    const attachment = await this.attachments.findWithTicket(attachmentId);
    if (!attachment) throw notFound("Không tìm thấy file.");
    if (!canAccessTicket(actor, attachment.ticket))
      throw forbidden("Bạn không có quyền tải file này.");

    return {
      content: await this.storage.read(attachment.storageKey),
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    };
  }
}
