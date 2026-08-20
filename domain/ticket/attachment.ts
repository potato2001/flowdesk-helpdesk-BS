import { invalidInput } from "../errors";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export type Attachment = {
  id: string;
  ticketId: string;
  commentId: string | null;
  uploadedById: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
};

export function assertUploadSize(sizeBytes: number) {
  if (sizeBytes <= 0 || sizeBytes > MAX_ATTACHMENT_BYTES)
    throw invalidInput("File phải có dung lượng từ 1 byte đến 10 MB.");
}

/** Strips anything that could escape the upload root or confuse the store. */
export function sanitizeFileName(fileName: string) {
  const base = fileName.split(/[\\/]/).pop() ?? "";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || "attachment";
}

/** Storage keys are scoped per ticket so one ticket can never read another's. */
export function storageKeyFor(
  ticketId: string,
  uniqueId: string,
  fileName: string,
) {
  return `${ticketId}/${uniqueId}-${sanitizeFileName(fileName)}`;
}
