import { currentUser } from "@/interface-adapters/http/controllers/auth.controller";

export const GET = () => currentUser();
