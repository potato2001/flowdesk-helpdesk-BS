import { listAuditLogs } from "@/interface-adapters/http/controllers/admin.controller";

export const GET = (request: Request) => listAuditLogs(request);
