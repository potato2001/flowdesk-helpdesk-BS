import type {
  SessionRecord,
  SessionRepository,
} from "@/application/ports/out/repositories";
import type { User } from "@/domain/user/user";
import { getPrisma } from "./client";
import { toUser } from "./mappers";

export class PrismaSessionRepository implements SessionRepository {
  async create(session: SessionRecord): Promise<void> {
    await getPrisma().session.create({ data: session });
  }

  async findUserByTokenHash(
    tokenHash: string,
    now: Date,
  ): Promise<User | null> {
    const row = await getPrisma().session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!row || row.expiresAt <= now) return null;
    return toUser(row.user);
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await getPrisma().session.deleteMany({ where: { tokenHash } });
  }

  async deleteForUser(userId: string): Promise<void> {
    await getPrisma().session.deleteMany({ where: { userId } });
  }

  async deleteExpired(now: Date): Promise<void> {
    await getPrisma().session.deleteMany({ where: { expiresAt: { lte: now } } });
  }
}
