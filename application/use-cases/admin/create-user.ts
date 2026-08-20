import type { AdminUserDTO } from "../../dto/user.dto";
import { toAdminUserDTO } from "../../mappers/user.mapper";
import type { CreateUserInput, CreateUserUseCase } from "../../ports/in/admin";
import type {
  AuditRepository,
  UserRepository,
} from "../../ports/out/repositories";
import type { PasswordHasher } from "../../ports/out/services";
import { invalidInput } from "@/domain/errors";
import { checkPassword } from "@/domain/user/password-policy";
import { normalizeEmail } from "@/domain/user/user";

export class CreateUser implements CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly audit: AuditRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInput): Promise<AdminUserDTO> {
    const violation = checkPassword(input.temporaryPassword);
    if (violation) throw invalidInput(violation);

    const user = await this.users.create({
      email: normalizeEmail(input.email),
      name: input.name,
      role: input.role,
      department: input.department || null,
      passwordHash: await this.hasher.hash(input.temporaryPassword),
      // A temporary password must be replaced on first sign-in.
      mustChangePassword: true,
    });
    await this.audit.record({
      actorId: input.actor.id,
      action: "USER_CREATED",
      targetType: "USER",
      targetId: user.id,
      metadata: { email: user.email, role: user.role },
      ipAddress: input.ipAddress,
    });
    return toAdminUserDTO(user);
  }
}
