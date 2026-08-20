import { NextResponse } from "next/server";
import { getPrisma } from "@/db/prisma";

export async function GET() {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "connected" });
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "disconnected" },
      { status: 503 },
    );
  }
}
