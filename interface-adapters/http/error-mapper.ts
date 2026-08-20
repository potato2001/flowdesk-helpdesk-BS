import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError, type DomainErrorKind } from "@/domain/errors";

/** The only place that knows domain failures have HTTP status codes. */
const STATUS: Record<DomainErrorKind, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INVALID_INPUT: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
};

export function toErrorResponse(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Dữ liệu không hợp lệ." },
      { status: 400 },
    );
  if (error instanceof DomainError)
    return NextResponse.json(
      { error: error.message },
      { status: STATUS[error.kind] },
    );
  console.error(error);
  return NextResponse.json(
    { error: "Đã xảy ra lỗi hệ thống." },
    { status: 500 },
  );
}

/** Wraps a handler so every thrown failure becomes a mapped response. */
export function handle(run: () => Promise<Response>): Promise<Response> {
  return run().catch(toErrorResponse);
}
