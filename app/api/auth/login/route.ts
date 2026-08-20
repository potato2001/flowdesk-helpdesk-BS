import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/db/prisma";
import { createSession } from "@/lib/auth";
import { requestIp, writeAudit } from "@/lib/audit";
import { apiError, HttpError } from "@/lib/http";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await getPrisma().user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!user || !user.active)
      throw new HttpError(401, "Email hoặc mật khẩu không đúng.");

    if (user.lockedUntil && user.lockedUntil > new Date())
      throw new HttpError(
        429,
        "Tài khoản đang tạm khóa. Vui lòng thử lại sau hoặc liên hệ quản trị viên.",
      );

    if (!(await compare(input.password, user.passwordHash))) {
      const failedLoginAttempts = user.failedLoginAttempts + 1;
      const lockedUntil =
        failedLoginAttempts >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_MINUTES * 60_000)
          : null;
      await getPrisma().user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: lockedUntil ? 0 : failedLoginAttempts,
          lockedUntil,
        },
      });
      await writeAudit({
        actorId: user.id,
        action: "LOGIN_FAILED",
        targetType: "USER",
        targetId: user.id,
        metadata: { locked: Boolean(lockedUntil) },
        ipAddress: requestIp(request),
      });
      throw new HttpError(401, "Email hoặc mật khẩu không đúng.");
    }

    await getPrisma().user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await createSession(user.id);
    await writeAudit({
      actorId: user.id,
      action: "LOGIN_SUCCESS",
      targetType: "USER",
      targetId: user.id,
      ipAddress: requestIp(request),
    });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
