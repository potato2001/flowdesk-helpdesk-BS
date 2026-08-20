import type { AuthenticateUseCase } from "../../ports/in/auth";
import type { SessionRepository } from "../../ports/out/repositories";
import type {
  Clock,
  SessionCookieStore,
  TokenGenerator,
} from "../../ports/out/services";
import { forbidden, unauthenticated } from "@/domain/errors";
import type { Role } from "@/domain/user/role";
import type { User } from "@/domain/user/user";

const SESSION_DAYS = 7;

export class Authenticate implements AuthenticateUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly cookies: SessionCookieStore,
    private readonly tokens: TokenGenerator,
    private readonly clock: Clock,
  ) {}

  async currentUser(): Promise<User | null> {
    const token = await this.cookies.read();
    if (!token) return null;
    const user = await this.sessions.findUserByTokenHash(
      this.tokens.hashToken(token),
      this.clock.now(),
    );
    if (!user || !user.active) return null;
    return user;
  }

  async requireUser(roles?: readonly Role[]): Promise<User> {
    const user = await this.currentUser();
    if (!user) throw unauthenticated();
    if (roles && !roles.includes(user.role))
      throw forbidden("Bạn không có quyền thực hiện thao tác này.");
    return user;
  }

  /** Issues a fresh session and sets the cookie, evicting expired rows first. */
  async startSession(userId: string): Promise<void> {
    const now = this.clock.now();
    await this.sessions.deleteExpired(now);
    const token = this.tokens.createToken();
    const expiresAt = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
    await this.sessions.create({
      tokenHash: this.tokens.hashToken(token),
      userId,
      expiresAt,
    });
    await this.cookies.write({ token, expiresAt });
  }

  async endSession(): Promise<void> {
    const token = await this.cookies.read();
    if (token) await this.sessions.deleteByTokenHash(this.tokens.hashToken(token));
    await this.cookies.clear();
  }

  async endAllSessions(userId: string): Promise<void> {
    await this.sessions.deleteForUser(userId);
    await this.cookies.clear();
  }
}
