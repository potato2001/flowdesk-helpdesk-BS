import type { AssignableUserDTO } from "../../dto/user.dto";
import { toAssignableUserDTO } from "../../mappers/user.mapper";
import type { ListAssignableUsersUseCase } from "../../ports/in/admin";
import type { UserRepository } from "../../ports/out/repositories";

export class ListAssignableUsers implements ListAssignableUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(): Promise<AssignableUserDTO[]> {
    return (await this.users.listAssignable()).map(toAssignableUserDTO);
  }
}
