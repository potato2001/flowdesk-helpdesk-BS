import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  flowdeskPrisma?: PrismaClient;
};

export function createPrismaClient(databaseUrl: string) {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}

export function getPrisma() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL chưa được cấu hình.");
  if (!globalForPrisma.flowdeskPrisma)
    globalForPrisma.flowdeskPrisma = createPrismaClient(databaseUrl);
  return globalForPrisma.flowdeskPrisma;
}
