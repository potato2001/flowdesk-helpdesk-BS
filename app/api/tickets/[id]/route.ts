import {
  getTicket,
  updateTicket,
} from "@/interface-adapters/http/controllers/ticket.controller";

type Context = { params: Promise<{ id: string }> };

export const GET = (_request: Request, context: Context) => getTicket(context);
export const PATCH = (request: Request, context: Context) =>
  updateTicket(request, context);
