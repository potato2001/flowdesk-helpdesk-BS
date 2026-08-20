import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { serializeTicket } from "@/lib/tickets";

const createSchema = z.object({
  title: z.string().trim().min(5).max(240),
  description: z.string().trim().min(5).max(10_000),
  category: z.string().trim().min(2).max(100),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  assigneeId: z.uuid().nullable().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const where =
      user.role === "REQUESTER"
        ? { requesterId: user.id }
        : user.role === "AGENT"
          ? { OR: [{ assigneeId: user.id }, { assigneeId: null }] }
          : {};
    const tickets = await getPrisma().ticket.findMany({
      where,
      include: { requester: true, assignee: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ tickets: tickets.map(serializeTicket) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = createSchema.parse(await request.json());
    const policy = await getPrisma().slaPolicy.findUnique({
      where: { priority: input.priority },
    });
    const now = Date.now();
    const responseMinutes = policy?.responseMinutes ?? 240;
    const resolutionMinutes = policy?.resolutionMinutes ?? 960;
    const assigneeId =
      user.role === "MANAGER" || user.role === "ADMIN"
        ? input.assigneeId
        : null;
    const ticket = await getPrisma().ticket.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        requesterId: user.id,
        assigneeId,
        responseDueAt: new Date(now + responseMinutes * 60_000),
        resolutionDueAt: new Date(now + resolutionMinutes * 60_000),
        activities: {
          create: {
            actorId: user.id,
            type: "TICKET_CREATED",
            summary: `Ticket được tạo với mức ưu tiên ${input.priority}`,
          },
        },
      },
      include: { requester: true, assignee: true },
    });
    return NextResponse.json(
      { ticket: serializeTicket(ticket) },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
