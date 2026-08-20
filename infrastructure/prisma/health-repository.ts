import type { HealthRepository } from "@/application/ports/out/repositories";
import { getPrisma } from "./client";

export class PrismaHealthRepository implements HealthRepository {
  async ping(): Promise<void> {
    await getPrisma().$queryRaw`SELECT 1`;
  }
}
