import type { LoginInput, LoginUseCase } from "../../ports/in/auth";
import type { SessionUserDTO } from "../../dto/user.dto";
import { toSessionUserDTO } from "../../mappers/user.mapper";
import type {
  AuditRepository,
  UserRepository,
} from "../../ports/out/repositories";
import type { Clock, PasswordHasher } from "../../ports/out/services";
import type { Authenticate } from "./authenticate";
import { rateLimited, unauthenticated } from "@/domain/errors";
import {
  clearedLock,
  isLocked,
  registerFailure,
} from "@/domain/user/account-lock";
import { normalizeEmail } from "@/domain/user/user";

/** Deliberately identical message for unknown user and wrong password. */
const REJECTED = "Email hoặc mật khẩu không đúng.";

export class Login implements LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly audit: AuditRepository,
    private readonly hasher: PasswordHasher,
    private readonly auth: Authenticate,
    private readonly clock: Clock,
  ) {}

  async execute(input: LoginInput): Promise<SessionUserDTO> {
    const now = this.clock.now();
    const user = await this.users.findByEmail(normalizeEmail(input.email));
    if (!user || !user.active) throw unauthenticated(REJECTED);

    if (isLocked(user, now))
      throw rateLimited(
        "Tài khoản đang tạm khóa. Vui lòng thử lại sau hoặc liên hệ quản trị viên.",
      );

    if (!(await this.hasher.verify(input.password, user.passwordHash))) {
      const next = registerFailure(user, now);
      await this.users.update(user.id, next);
      await this.audit.record({
        actorId: user.id,
        action: "LOGIN_FAILED",
        targetType: "USER",
        targetId: user.id,
        metadata: { locked: Boolean(next.lockedUntil) },
        ipAddress: input.ipAddress,
      });
      throw unauthenticated(REJECTED);
    }

    await this.users.update(user.id, clearedLock());
    await this.auth.startSession(user.id);
    await this.audit.record({
      actorId: user.id,
      action: "LOGIN_SUCCESS",
      targetType: "USER",
      targetId: user.id,
      ipAddress: input.ipAddress,
    });
    return toSessionUserDTO(user);
  }
}
