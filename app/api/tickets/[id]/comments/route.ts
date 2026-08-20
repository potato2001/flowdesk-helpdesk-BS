import { addComment } from "@/interface-adapters/http/controllers/ticket.controller";

export const POST = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => addComment(request, context);
