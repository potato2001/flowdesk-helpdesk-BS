import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireUser, canAccessTicket } from "@/lib/auth";
import { apiError, HttpError } from "@/lib/http";
import { getPrisma } from "@/db/prisma";

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const attachment = await getPrisma().attachment.findUnique({
      where: { id },
      include: { ticket: true },
    });
    if (!attachment) throw new HttpError(404, "Không tìm thấy file.");
    if (!canAccessTicket(user, attachment.ticket))
      throw new HttpError(403, "Bạn không có quyền tải file này.");
    const uploadRoot = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./data/uploads");
    const target = path.resolve(uploadRoot, attachment.storageKey);
    if (!target.startsWith(`${uploadRoot}${path.sep}`))
      throw new HttpError(400, "Đường dẫn file không hợp lệ.");
    const body = await readFile(/* turbopackIgnore: true */ target);
    return new Response(body, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(attachment.sizeBytes),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
