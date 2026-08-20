import { z } from "zod";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/domain/ticket/ticket";

/** Who the ticket is being raised for; omitted means "myself". */
const requesterSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("self") }),
  z.object({ kind: z.literal("existing"), userId: z.uuid() }),
  z.object({
    kind: z.literal("new"),
    email: z.email(),
    name: z.string().trim().min(2).max(120),
    department: z.string().trim().max(120).nullable().optional(),
  }),
]);

export const createTicketSchema = z.object({
  title: z.string().trim().min(5).max(240),
  description: z.string().trim().min(5).max(10_000),
  category: z.string().trim().min(2).max(100),
  priority: z.enum(TICKET_PRIORITIES).default("MEDIUM"),
  assigneeId: z.uuid().nullable().optional(),
  requester: requesterSchema.optional(),
});

export const updateTicketSchema = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    assigneeId: z.uuid().nullable().optional(),
  })
  .refine(
    (input) => input.status !== undefined || input.assigneeId !== undefined,
    { message: "Không có thay đổi nào được gửi lên." },
  );

export const addCommentSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
  internal: z.boolean().default(false),
});
