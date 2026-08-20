import "dotenv/config";
import { hash } from "bcryptjs";
import { getPrisma } from "../infrastructure/prisma/client";

const prisma = getPrisma();
const passwordHash = await hash(
  process.env.SEED_ADMIN_PASSWORD ?? "Flowdesk@123",
  12,
);

const users = await Promise.all([
  prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@flowdesk.local" },
    update: { passwordHash, active: true },
    create: {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@flowdesk.local",
      name: "Quản trị Flowdesk",
      role: "ADMIN",
      department: "IT",
      passwordHash,
    },
  }),
  prisma.user.upsert({
    where: { email: "manager@flowdesk.local" },
    update: { passwordHash, active: true },
    create: {
      email: "manager@flowdesk.local",
      name: "Hoàng Anh",
      role: "MANAGER",
      department: "IT",
      passwordHash,
    },
  }),
  prisma.user.upsert({
    where: { email: "agent@flowdesk.local" },
    update: { passwordHash, active: true },
    create: {
      email: "agent@flowdesk.local",
      name: "Ngọc Lan",
      role: "AGENT",
      department: "IT",
      passwordHash,
    },
  }),
  prisma.user.upsert({
    where: { email: "requester@flowdesk.local" },
    update: { passwordHash, active: true },
    create: {
      email: "requester@flowdesk.local",
      name: "Thu Hà",
      role: "REQUESTER",
      department: "Nhân sự",
      passwordHash,
    },
  }),
]);

const [admin, manager, agent, requester] = users;
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

if ((await prisma.ticket.count()) === 0) {
  const now = Date.now();
  const ticket = await prisma.ticket.create({
    data: {
      number: 1038,
      title: "Laptop phòng Kế toán khởi động rất chậm",
      description:
        "Máy mất khoảng 12 phút để vào Windows và thường xuyên đứng ở màn hình đăng nhập. Sự cố bắt đầu từ sáng nay sau khi cập nhật hệ thống.",
      category: "Phần cứng",
      status: "NEW",
      priority: "HIGH",
      requesterId: requester.id,
      assigneeId: agent.id,
      responseDueAt: new Date(now + 60 * 60_000),
      resolutionDueAt: new Date(now + 8 * 60 * 60_000),
      comments: {
        create: [
          {
            authorId: requester.id,
            body: "Máy hiện vẫn khởi động được nhưng rất chậm. Em đã thử khởi động lại hai lần.",
            visibility: "PUBLIC",
          },
          {
            authorId: manager.id,
            body: "Đã tiếp nhận. Team sẽ kiểm tra sức khỏe ổ cứng và bản cập nhật gần nhất.",
            visibility: "PUBLIC",
          },
        ],
      },
      activities: {
        create: [
          {
            actorId: requester.id,
            type: "TICKET_CREATED",
            summary: "Ticket được tạo với mức ưu tiên Cao",
          },
          {
            actorId: manager.id,
            type: "ASSIGNEE_CHANGED",
            summary: "Đã phân công cho Ngọc Lan",
          },
        ],
      },
    },
  });
  await prisma.ticket.createMany({
    data: [
      {
        number: 1037,
        title: "Yêu cầu cấp quyền thư mục dự án Phoenix",
        description:
          "Cần quyền chỉnh sửa thư mục dùng chung Phoenix cho nhóm kinh doanh.",
        category: "Tài khoản",
        status: "NEW",
        priority: "MEDIUM",
        requesterId: requester.id,
        assigneeId: agent.id,
        responseDueAt: new Date(now + 4 * 60 * 60_000),
        resolutionDueAt: new Date(now + 16 * 60 * 60_000),
      },
      {
        number: 1036,
        title: "Máy in tầng 2 báo lỗi kẹt giấy liên tục",
        description: "Máy in HP báo kẹt giấy dù đã kiểm tra khay giấy.",
        category: "Phần cứng",
        status: "IN_PROGRESS",
        priority: "LOW",
        requesterId: requester.id,
        assigneeId: agent.id,
        responseDueAt: new Date(now - 60 * 60_000),
        firstRespondedAt: new Date(now - 2 * 60 * 60_000),
        resolutionDueAt: new Date(now + 30 * 60 * 60_000),
      },
    ],
  });
  console.log(`Đã tạo ticket mẫu HD-${ticket.number}.`);
}

console.log(`Flowdesk local đã sẵn sàng. Đăng nhập: ${admin.email}`);
await prisma.$disconnect();
