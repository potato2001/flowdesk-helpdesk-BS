import { login } from "@/interface-adapters/http/controllers/auth.controller";

export const POST = (request: Request) => login(request);
