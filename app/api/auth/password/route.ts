import { changePassword } from "@/interface-adapters/http/controllers/auth.controller";

export const POST = (request: Request) => changePassword(request);
