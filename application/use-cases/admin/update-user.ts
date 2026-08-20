import type { AdminUserDTO } from "../../dto/user.dto";
import { toAdminUserDTO } from "../../mappers/user.mapper";
import type { UpdateUserInput, UpdateUserUseCase } from "../../ports/in/admin";
import type {
  AuditRepository,
  UserChangeSet,
  UserRepository,
} from "../../ports/out/repositories";
import type { Clock, PasswordHasher } from "../../ports/out/services";
import {
  assertChangeAllowed,
  invalidatesSessions,
} from "@/domain/admin/user-administration";
import { invalidInput, notFound } from "@/domain/errors";
import { clearedLock } from "@/domain/user/account-lock";
import { checkPassword } from "@/domain/user/password-policy";

export class UpdateUser implements UpdateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly audit: AuditRepository,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateUserInput): Promise<AdminUserDTO> {
    const target = await this.users.findById(input.targetId);
    if (!target) throw notFound("Không tìm thấy tài khoản.");

    if (input.temporaryPassword) {
      const violation = checkPassword(input.temporaryPassword);
      if (violation) throw invalidInput(violation);
    }

    const change = { role: input.role, active: input.active };
    // The admin-count query only matters when the change could remove an admin.
    const activeAdminCount =
      target.role === "ADMIN" ? await this.users.countActiveAdmins() : 0;
    assertChangeAllowed(input.actor, target, change, activeAdminCount);

    const changeSet: UserChangeSet = {
      name: input.name,
      role: input.role,
      department: input.department,
      active: input.active,
      ...(input.unlock ? clearedLock() : {}),
      ...(input.temporaryPassword
        ? {
            passwordHash: await this.hasher.hash(input.temporaryPassword),
            passwordChangedAt: this.clock.now(),
            mustChangePassword: true,
            ...clearedLock(),
          }
        : {}),
    };

    const revoke = invalidatesSessions(target, {
      ...change,
      temporaryPassword: input.temporaryPassword,
    });
    const user = revoke
      ? await this.users.updateAndRevokeSessions(target.id, changeSet)
      : await this.users.update(target.id, changeSet);

    await this.audit.record({
      actorId: input.actor.id,
      action: input.temporaryPassword
        ? "PASSWORD_RESET"
        : input.unlock
          ? "USER_UNLOCKED"
          : "USER_UPDATED",
      targetType: "USER",
      targetId: user.id,
      metadata: { email: user.email, role: user.role, active: user.active },
      ipAddress: input.ipAddress,
    });
    return toAdminUserDTO(user);
  }
}
