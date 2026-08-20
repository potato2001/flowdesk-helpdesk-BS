import { updateUser } from "@/interface-adapters/http/controllers/admin.controller";

export const PATCH = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) => updateUser(request, context);
