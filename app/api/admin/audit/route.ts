import { NextResponse } from "next/server";
import { getPrisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";

export async function GET() {
  try {
    await requireUser(["ADMIN"]);
    const logs = await getPrisma().auditLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ logs });
  } catch (error) {
    return apiError(error);
  }
}
