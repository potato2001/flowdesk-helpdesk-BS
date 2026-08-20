import { getPrisma } from "@/db/prisma";

type AuditMetadata = Record<string, string | number | boolean | null>;

export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}

export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: AuditMetadata;
  ipAddress?: string | null;
}) {
  await getPrisma().auditLog.create({ data: input });
}
