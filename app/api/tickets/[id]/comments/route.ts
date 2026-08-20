import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { apiError, HttpError } from "@/lib/http";
import { assertTicketAccess } from "@/lib/tickets";

const schema = z.object({
  body: z.string().trim().min(1).max(10_000),
  internal: z.boolean().default(false),
});
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
    const input = schema.parse(await request.json());
    const { id } = await context.params;
    if (input.internal && user.role === "REQUESTER")
      throw new HttpError(403, "Requester không thể tạo ghi chú nội bộ.");
    const ticket = await getPrisma().ticket.findUnique({
      where: { number: numberFrom(id) },
    });
    assertTicketAccess(user, ticket);
    const comment = await getPrisma().comment.create({
      data: {
        ticketId: ticket!.id,
        authorId: user.id,
        body: input.body,
        visibility: input.internal ? "INTERNAL" : "PUBLIC",
      },
      include: { author: true },
    });
    await getPrisma().activity.create({
      data: {
        ticketId: ticket!.id,
        actorId: user.id,
        type: "COMMENT_ADDED",
        summary: input.internal
          ? "Đã thêm ghi chú nội bộ"
          : "Đã thêm bình luận công khai",
      },
    });
    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          author: comment.author.name,
          body: comment.body,
          internal: comment.visibility === "INTERNAL",
          time: comment.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
