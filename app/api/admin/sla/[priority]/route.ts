import { updateSlaPolicy } from "@/interface-adapters/http/controllers/admin.controller";

export const PATCH = (
  request: Request,
  context: { params: Promise<{ priority: string }> },
) => updateSlaPolicy(request, context);
