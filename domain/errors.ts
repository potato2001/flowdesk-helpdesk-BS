/**
 * Domain errors. These carry business meaning only — no HTTP status, no
 * framework types. Mapping to a transport lives in interface-adapters/http.
 */
export type DomainErrorKind =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "CONFLICT"
  | "RATE_LIMITED";

export class DomainError extends Error {
  constructor(
    public readonly kind: DomainErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const unauthenticated = (message = "Bạn cần đăng nhập.") =>
  new DomainError("UNAUTHENTICATED", message);
export const forbidden = (message: string) =>
  new DomainError("FORBIDDEN", message);
export const notFound = (message: string) =>
  new DomainError("NOT_FOUND", message);
export const invalidInput = (message: string) =>
  new DomainError("INVALID_INPUT", message);
export const conflict = (message: string) =>
  new DomainError("CONFLICT", message);
export const rateLimited = (message: string) =>
  new DomainError("RATE_LIMITED", message);
