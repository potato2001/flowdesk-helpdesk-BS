import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
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
