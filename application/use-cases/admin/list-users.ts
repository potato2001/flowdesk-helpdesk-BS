import type { PageMetaDTO } from "../../dto/admin.dto";
import type { AdminUserDTO } from "../../dto/user.dto";
import { toAdminUserDTO, toPageMetaDTO } from "../../mappers/user.mapper";
import type { ListUsersInput, ListUsersUseCase } from "../../ports/in/admin";
import type { UserRepository } from "../../ports/out/repositories";
import { resolvePage } from "../paging";

export class ListUsers implements ListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(
    input: ListUsersInput,
  ): Promise<{ users: AdminUserDTO[]; meta: PageMetaDTO }> {
    const page = await this.users.listPage(resolvePage(input), {
      search: input.search,
      role: input.role,
      active: input.active,
    });
    return {
      users: page.items.map(toAdminUserDTO),
      meta: toPageMetaDTO(page.meta),
    };
  }
}
