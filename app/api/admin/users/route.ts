import {
  createUser,
  listUsers,
} from "@/interface-adapters/http/controllers/admin.controller";

export const GET = (request: Request) => listUsers(request);
export const POST = (request: Request) => createUser(request);
