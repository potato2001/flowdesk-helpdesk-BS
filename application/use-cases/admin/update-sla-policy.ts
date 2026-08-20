import type { SlaPolicyDTO } from "../../dto/admin.dto";
import { toSlaPolicyDTO } from "../../mappers/user.mapper";
import type {
  UpdateSlaPolicyInput,
  UpdateSlaPolicyUseCase,
} from "../../ports/in/admin";
import type {
  AuditRepository,
  SlaPolicyRepository,
} from "../../ports/out/repositories";
import { notFound } from "@/domain/errors";
import { assertSlaWindow } from "@/domain/ticket/sla-policy";

export class UpdateSlaPolicy implements UpdateSlaPolicyUseCase {
  constructor(
    private readonly policies: SlaPolicyRepository,
    private readonly audit: AuditRepository,
  ) {}

  async execute(input: UpdateSlaPolicyInput): Promise<SlaPolicyDTO> {
    const existing = await this.policies.findByPriority(input.priority);
    if (!existing) throw notFound("Không tìm thấy chính sách SLA.");

    // Validate the resulting window, not just the fields that were sent.
    assertSlaWindow(
      input.responseMinutes ?? existing.responseMinutes,
      input.resolutionMinutes ?? existing.resolutionMinutes,
    );

    const policy = await this.policies.update(input.priority, {
      name: input.name,
      responseMinutes: input.responseMinutes,
      resolutionMinutes: input.resolutionMinutes,
      businessHoursOnly: input.businessHoursOnly,
      active: input.active,
    });
    await this.audit.record({
      actorId: input.actor.id,
      action: "SLA_POLICY_UPDATED",
      targetType: "SLA_POLICY",
      targetId: policy.id,
      metadata: {
        priority: policy.priority,
        responseMinutes: policy.responseMinutes,
        resolutionMinutes: policy.resolutionMinutes,
      },
      ipAddress: input.ipAddress,
    });
    return toSlaPolicyDTO(policy);
  }
}
