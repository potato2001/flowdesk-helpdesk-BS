import type {
  ChangePasswordInput,
  ChangePasswordUseCase,
} from "../../ports/in/auth";
import type {
  AuditRepository,
  UserRepository,
} from "../../ports/out/repositories";
import type { Clock, PasswordHasher } from "../../ports/out/services";
import type { Authenticate } from "./authenticate";
import { invalidInput } from "@/domain/errors";
import { clearedLock } from "@/domain/user/account-lock";
import { checkPassword } from "@/domain/user/password-policy";

export class ChangePassword implements ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly audit: AuditRepository,
    private readonly hasher: PasswordHasher,
    private readonly auth: Authenticate,
    private readonly clock: Clock,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const { actor } = input;
    const violation = checkPassword(input.newPassword);
    if (violation) throw invalidInput(violation);

    if (!(await this.hasher.verify(input.currentPassword, actor.passwordHash)))
      throw invalidInput("Mật khẩu hiện tại không đúng.");
    if (await this.hasher.verify(input.newPassword, actor.passwordHash))
      throw invalidInput("Mật khẩu mới phải khác mật khẩu hiện tại.");

    await this.users.update(actor.id, {
      passwordHash: await this.hasher.hash(input.newPassword),
      passwordChangedAt: this.clock.now(),
      mustChangePassword: false,
      ...clearedLock(),
    });
    // Every other device is signed out, then this one is re-issued.
    await this.auth.endAllSessions(actor.id);
    await this.auth.startSession(actor.id);
    await this.audit.record({
      actorId: actor.id,
      action: "PASSWORD_CHANGED",
      targetType: "USER",
      targetId: actor.id,
      ipAddress: input.ipAddress,
    });
  }
}
