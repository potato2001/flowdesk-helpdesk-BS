import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { apiError, HttpError } from "@/lib/http";
import { assertTicketAccess, serializeTicket } from "@/lib/tickets";

const patchSchema = z
  .object({
    status: z
      .enum(["NEW", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"])
      .optional(),
    assigneeId: z.uuid().nullable().optional(),
  })
  .refine(
    (input) => input.status !== undefined || input.assigneeId !== undefined,
  );
function ticketNumber(id: string) {
  const value = Number(id.replace(/^HD-/i, ""));
  if (!Number.isInteger(value))
    throw new HttpError(400, "Mã ticket không hợp lệ.");
  return value;
}

export async function GET(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const ticket = await getPrisma().ticket.findUnique({
      where: { number: ticketNumber(id) },
      include: {
        requester: true,
        assignee: true,
        comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
        activities: {
          include: { actor: true },
          orderBy: { createdAt: "desc" },
        },
        attachments: {
          include: { uploadedBy: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    assertTicketAccess(user, ticket);
    const result = serializeTicket(ticket!);
    if (user.role === "REQUESTER")
      result.comments = result.comments.filter(
        (comment: { internal: boolean }) => !comment.internal,
      );
    return NextResponse.json({ ticket: result });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser(["AGENT", "MANAGER", "ADMIN"]);
    const { id } = await context.params;
    const input = patchSchema.parse(await request.json());
    const existing = await getPrisma().ticket.findUnique({
      where: { number: ticketNumber(id) },
    });
    assertTicketAccess(user, existing);
    if (
      input.assigneeId !== undefined &&
      user.role !== "MANAGER" &&
      user.role !== "ADMIN"
    )
      throw new HttpError(403, "Chỉ Manager và Admin có thể phân công.");
    const data: {
      status?: typeof input.status;
      assigneeId?: string | null;
      resolvedAt?: Date | null;
    } = {};
    if (input.status) {
      data.status = input.status;
      data.resolvedAt =
        input.status === "RESOLVED" || input.status === "CLOSED"
          ? new Date()
          : null;
    }
    if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId;
    const summary = input.status
      ? `Đã chuyển trạng thái sang ${input.status}`
      : "Đã cập nhật người xử lý";
    const ticket = await getPrisma().ticket.update({
      where: { number: ticketNumber(id) },
      data: {
        ...data,
        activities: {
          create: {
            actorId: user.id,
            type: input.status ? "STATUS_CHANGED" : "ASSIGNEE_CHANGED",
            summary,
          },
        },
      },
      include: { requester: true, assignee: true },
    });
    return NextResponse.json({ ticket: serializeTicket(ticket) });
  } catch (error) {
    return apiError(error);
  }
}
