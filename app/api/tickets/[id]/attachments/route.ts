import { addAttachment } from "@/interface-adapters/http/controllers/ticket.controller";

export const POST = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => addAttachment(request, context);
