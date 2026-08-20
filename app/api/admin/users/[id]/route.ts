import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { requestIp, writeAudit } from "@/lib/audit";
import { apiError, HttpError } from "@/lib/http";

const roles = ["REQUESTER", "AGENT", "MANAGER", "ADMIN"] as const;
const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.enum(roles).optional(),
    department: z.string().trim().max(120).nullable().optional(),
    active: z.boolean().optional(),
    unlock: z.boolean().optional(),
    temporaryPassword: z
      .string()
      .min(12)
      .max(200)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/)
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireUser(["ADMIN"]);
    const { id } = await context.params;
    const input = patchSchema.parse(await request.json());
    const target = await getPrisma().user.findUnique({ where: { id } });
    if (!target) throw new HttpError(404, "Không tìm thấy tài khoản.");

    if (
      actor.id === target.id &&
      (input.active === false || (input.role && input.role !== "ADMIN"))
    )
      throw new HttpError(400, "Bạn không thể tự vô hiệu hóa hoặc hạ quyền.");

    if (
      target.role === "ADMIN" &&
      target.active &&
      (input.active === false || (input.role && input.role !== "ADMIN"))
    ) {
      const activeAdmins = await getPrisma().user.count({
        where: { role: "ADMIN", active: true },
      });
      if (activeAdmins <= 1)
        throw new HttpError(400, "Hệ thống phải còn ít nhất một Admin.");
    }

    const securityChanged =
      input.active === false ||
      (input.role !== undefined && input.role !== target.role) ||
      Boolean(input.temporaryPassword);
    const user = await getPrisma().$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          name: input.name,
          role: input.role,
          department: input.department,
          active: input.active,
          ...(input.unlock
            ? { failedLoginAttempts: 0, lockedUntil: null }
            : {}),
          ...(input.temporaryPassword
            ? {
                passwordHash: await hash(input.temporaryPassword, 12),
                passwordChangedAt: new Date(),
                mustChangePassword: true,
                failedLoginAttempts: 0,
                lockedUntil: null,
              }
            : {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          active: true,
          failedLoginAttempts: true,
          lockedUntil: true,
          mustChangePassword: true,
          createdAt: true,
        },
      });
      if (securityChanged)
        await tx.session.deleteMany({ where: { userId: id } });
      return updated;
    });
    await writeAudit({
      actorId: actor.id,
      action: input.temporaryPassword
        ? "PASSWORD_RESET"
        : input.unlock
          ? "USER_UNLOCKED"
          : "USER_UPDATED",
      targetType: "USER",
      targetId: user.id,
      metadata: { email: user.email, role: user.role, active: user.active },
      ipAddress: requestIp(request),
    });
    return NextResponse.json({ user });
  } catch (error) {
    return apiError(error);
  }
}
