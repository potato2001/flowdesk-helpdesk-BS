import type {
  AuditEntry,
  AuditFilters,
  AuditRecord,
  AuditRepository,
  Page,
  PageRequest,
} from "@/application/ports/out/repositories";
import { getPrisma } from "./client";

export class PrismaAuditRepository implements AuditRepository {
  async record(entry: AuditEntry): Promise<void> {
    await getPrisma().auditLog.create({ data: entry });
  }

  async listRecent(limit: number): Promise<AuditRecord[]> {
    const rows = await getPrisma().auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, name: true, email: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      targetId: row.targetId,
      createdAt: row.createdAt,
      actor: row.actor,
    }));
  }

  async listPage(
    page: PageRequest,
    filters: AuditFilters,
  ): Promise<Page<AuditRecord>> {
    const where = {
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
    };
    const [total, rows] = await getPrisma().$transaction([
      getPrisma().auditLog.count({ where }),
      getPrisma().auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page.page - 1) * page.pageSize,
        take: page.pageSize,
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
    ]);
    return {
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        targetId: row.targetId,
        createdAt: row.createdAt,
        actor: row.actor,
      })),
      meta: {
        ...page,
        total,
        totalPages: Math.max(1, Math.ceil(total / page.pageSize)),
      },
    };
  }

  async listActions(): Promise<string[]> {
    const rows = await getPrisma().auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    });
    return rows.map((row) => row.action);
  }
}
