import { downloadAttachment } from "@/interface-adapters/http/controllers/ticket.controller";

export const GET = (
  _request: Request,
  context: { params: Promise<{ id: string }> },
) => downloadAttachment(context);
