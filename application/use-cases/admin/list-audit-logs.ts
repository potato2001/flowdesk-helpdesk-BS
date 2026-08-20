import type { PageMetaDTO } from "../../dto/admin.dto";
import type { AuditLogDTO } from "../../dto/user.dto";
import { toAuditLogDTO, toPageMetaDTO } from "../../mappers/user.mapper";
import type {
  ListAuditLogsInput,
  ListAuditLogsUseCase,
} from "../../ports/in/admin";
import type { AuditRepository } from "../../ports/out/repositories";
import { resolvePage } from "../paging";

export class ListAuditLogs implements ListAuditLogsUseCase {
  constructor(private readonly audit: AuditRepository) {}

  async execute(
    input: ListAuditLogsInput,
  ): Promise<{ logs: AuditLogDTO[]; meta: PageMetaDTO; actions: string[] }> {
    // The filter dropdown needs every action name, not just those on this page.
    const [page, actions] = await Promise.all([
      this.audit.listPage(resolvePage(input), {
        action: input.action,
        actorId: input.actorId,
      }),
      this.audit.listActions(),
    ]);
    return {
      logs: page.items.map(toAuditLogDTO),
      meta: toPageMetaDTO(page.meta),
      actions,
    };
  }
}
