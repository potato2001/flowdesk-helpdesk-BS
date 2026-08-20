import { checkHealth } from "@/interface-adapters/http/controllers/admin.controller";

export const GET = () => checkHealth();
