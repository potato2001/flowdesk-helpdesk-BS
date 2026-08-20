import { NextResponse } from "next/server";
import { getPrisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";

export async function GET() {
  try {
    await requireUser(["AGENT", "MANAGER", "ADMIN"]);
    const users = await getPrisma().user.findMany({
      where: { active: true, role: { in: ["AGENT", "MANAGER", "ADMIN"] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return apiError(error);
  }
}
