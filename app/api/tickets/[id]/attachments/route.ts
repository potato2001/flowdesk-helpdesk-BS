import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getPrisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { apiError, HttpError } from "@/lib/http";
import { assertTicketAccess } from "@/lib/tickets";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
function numberFrom(id: string) {
  const value = Number(id.replace(/^HD-/i, ""));
  if (!Number.isInteger(value))
    throw new HttpError(400, "Mã ticket không hợp lệ.");
  return value;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const ticket = await getPrisma().ticket.findUnique({
      where: { number: numberFrom(id) },
    });
    assertTicketAccess(user, ticket);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      throw new HttpError(400, "Vui lòng chọn file.");
    if (file.size <= 0 || file.size > MAX_FILE_SIZE)
      throw new HttpError(400, "File phải có dung lượng từ 1 byte đến 10 MB.");
    const safeName =
      path
        .basename(file.name)
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-180) || "attachment";
    const storageKey = `${ticket!.id}/${randomUUID()}-${safeName}`;
    const uploadRoot = path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./data/uploads");
    const target = path.resolve(uploadRoot, storageKey);
    if (!target.startsWith(`${uploadRoot}${path.sep}`))
      throw new HttpError(400, "Tên file không hợp lệ.");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await file.arrayBuffer()), {
      flag: "wx",
    });
    const attachment = await getPrisma().attachment.create({
      data: {
        ticketId: ticket!.id,
        uploadedById: user.id,
        fileName: file.name.slice(0, 255),
        storageKey,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      },
      include: { uploadedBy: true },
    });
    await getPrisma().activity.create({
      data: {
        ticketId: ticket!.id,
        actorId: user.id,
        type: "ATTACHMENT_ADDED",
        summary: `Đã đính kèm ${attachment.fileName}`,
      },
    });
    return NextResponse.json(
      {
        attachment: {
          id: attachment.id,
          name: attachment.fileName,
          sizeBytes: attachment.sizeBytes,
          author: attachment.uploadedBy.name,
          time: attachment.createdAt,
          downloadUrl: `/api/attachments/${attachment.id}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
