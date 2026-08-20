import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/db/prisma";
import { createSession, destroyAllSessions, requireUser } from "@/lib/auth";
import { requestIp, writeAudit } from "@/lib/audit";
import { apiError, HttpError } from "@/lib/http";

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z
    .string()
    .min(12, "Mật khẩu mới phải có ít nhất 12 ký tự.")
    .max(200)
    .regex(/[a-z]/, "Mật khẩu cần có chữ thường.")
    .regex(/[A-Z]/, "Mật khẩu cần có chữ hoa.")
    .regex(/[0-9]/, "Mật khẩu cần có chữ số.")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu cần có ký tự đặc biệt."),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = passwordSchema.parse(await request.json());
    if (!(await compare(input.currentPassword, user.passwordHash)))
      throw new HttpError(400, "Mật khẩu hiện tại không đúng.");
    if (await compare(input.newPassword, user.passwordHash))
      throw new HttpError(400, "Mật khẩu mới phải khác mật khẩu hiện tại.");

    await getPrisma().user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(input.newPassword, 12),
        passwordChangedAt: new Date(),
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await destroyAllSessions(user.id);
    await createSession(user.id);
    await writeAudit({
      actorId: user.id,
      action: "PASSWORD_CHANGED",
      targetType: "USER",
      targetId: user.id,
      ipAddress: requestIp(request),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
