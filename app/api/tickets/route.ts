import {
  createTicket,
  listTickets,
} from "@/interface-adapters/http/controllers/ticket.controller";

export const GET = () => listTickets();
export const POST = (request: Request) => createTicket(request);
