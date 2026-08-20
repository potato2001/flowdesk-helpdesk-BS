import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { requestIp, writeAudit } from "@/lib/audit";
import { apiError } from "@/lib/http";

const roles = ["REQUESTER", "AGENT", "MANAGER", "ADMIN"] as const;
const strongPassword = z
  .string()
  .min(12)
  .max(200)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);
const createSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(2).max(120),
  role: z.enum(roles),
  department: z.string().trim().max(120).optional().nullable(),
  temporaryPassword: strongPassword,
});

const userSelect = {
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
} as const;

export async function GET() {
  try {
    await requireUser(["ADMIN"]);
    const users = await getPrisma().user.findMany({
      select: userSelect,
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });
    return NextResponse.json({ users });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireUser(["ADMIN"]);
    const input = createSchema.parse(await request.json());
    const user = await getPrisma().user.create({
      data: {
        email: input.email.toLowerCase(),
        name: input.name,
        role: input.role,
        department: input.department || null,
        passwordHash: await hash(input.temporaryPassword, 12),
        mustChangePassword: true,
      },
      select: userSelect,
    });
    await writeAudit({
      actorId: actor.id,
      action: "USER_CREATED",
      targetType: "USER",
      targetId: user.id,
      metadata: { email: user.email, role: user.role },
      ipAddress: requestIp(request),
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
