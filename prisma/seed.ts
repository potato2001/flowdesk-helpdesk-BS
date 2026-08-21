import "dotenv/config";
import { hash } from "bcryptjs";
import { getPrisma } from "../infrastructure/prisma/client";

const prisma = getPrisma();
const passwordHash = await hash(
  process.env.SEED_ADMIN_PASSWORD ?? "Flowdesk@123",
  12,
);

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@bravestars.local";
const admin = await prisma.user.upsert({
  where: { email: adminEmail },
  update: { passwordHash, active: true },
  create: {
    email: adminEmail,
    name: "Quản trị Flowdesk",
    role: "ADMIN",
    department: "IT",
    passwordHash,
  },
});

const policies = [
  ["LOW", "SLA ưu tiên thấp", 480, 2400],
  ["MEDIUM", "SLA ưu tiên trung bình", 240, 960],
  ["HIGH", "SLA ưu tiên cao", 60, 480],
  ["URGENT", "SLA khẩn cấp", 15, 120],
] as const;
for (const [priority, name, responseMinutes, resolutionMinutes] of policies) {
  await prisma.slaPolicy.upsert({
    where: { priority },
    update: { name, responseMinutes, resolutionMinutes, active: true },
    create: { priority, name, responseMinutes, resolutionMinutes },
  });
}

console.log(`Flowdesk local đã sẵn sàng. Đăng nhập: ${admin.email}`);
await prisma.$disconnect();
