/**
 * Thin fetch gateway. Every API failure becomes an ApiError carrying the
 * server's Vietnamese message, so query/mutation consumers surface one shape.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function request<T>(
  input: string,
  init?: RequestInit & { signal?: AbortSignal },
): Promise<T> {
  const response = await fetch(input, init);
  const data = await parse(response);
  if (!response.ok)
    throw new ApiError(
      response.status,
      data?.error ?? "Đã xảy ra lỗi hệ thống.",
    );
  return data as T;
}

export function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}
