import type {
  SlaPolicyChange,
  SlaPolicyRecord,
  SlaPolicyRepository,
} from "@/application/ports/out/repositories";
import type { SlaWindow } from "@/domain/ticket/sla";
import type { TicketPriority } from "@/domain/ticket/ticket";
import { getPrisma } from "./client";

export class PrismaSlaPolicyRepository implements SlaPolicyRepository {
  async windowFor(priority: TicketPriority): Promise<SlaWindow | null> {
    const row = await getPrisma().slaPolicy.findUnique({ where: { priority } });
    if (!row) return null;
    return {
      responseMinutes: row.responseMinutes,
      resolutionMinutes: row.resolutionMinutes,
    };
  }

  async listAll(): Promise<SlaPolicyRecord[]> {
    const rows = await getPrisma().slaPolicy.findMany({
      orderBy: { responseMinutes: "asc" },
    });
    return rows.map(toRecord);
  }

  async findByPriority(
    priority: TicketPriority,
  ): Promise<SlaPolicyRecord | null> {
    const row = await getPrisma().slaPolicy.findUnique({ where: { priority } });
    return row ? toRecord(row) : null;
  }

  async update(
    priority: TicketPriority,
    change: SlaPolicyChange,
  ): Promise<SlaPolicyRecord> {
    const row = await getPrisma().slaPolicy.update({
      where: { priority },
      data: change,
    });
    return toRecord(row);
  }
}

function toRecord(row: {
  id: string;
  name: string;
  priority: string;
  responseMinutes: number;
  resolutionMinutes: number;
  businessHoursOnly: boolean;
  active: boolean;
  updatedAt: Date;
}): SlaPolicyRecord {
  return {
    id: row.id,
    name: row.name,
    priority: row.priority as TicketPriority,
    responseMinutes: row.responseMinutes,
    resolutionMinutes: row.resolutionMinutes,
    businessHoursOnly: row.businessHoursOnly,
    active: row.active,
    updatedAt: row.updatedAt,
  };
}
