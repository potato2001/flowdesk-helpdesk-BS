import type { SlaPolicyDTO } from "../../dto/admin.dto";
import { toSlaPolicyDTO } from "../../mappers/user.mapper";
import type { ListSlaPoliciesUseCase } from "../../ports/in/admin";
import type { SlaPolicyRepository } from "../../ports/out/repositories";

export class ListSlaPolicies implements ListSlaPoliciesUseCase {
  constructor(private readonly policies: SlaPolicyRepository) {}

  async execute(): Promise<SlaPolicyDTO[]> {
    return (await this.policies.listAll()).map(toSlaPolicyDTO);
  }
}
