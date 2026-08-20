import { cookies } from "next/headers";
import type {
  SessionCookie,
  SessionCookieStore,
} from "@/application/ports/out/services";

const COOKIE_NAME = "flowdesk_session";

export class NextSessionCookieStore implements SessionCookieStore {
  async read(): Promise<string | null> {
    return (await cookies()).get(COOKIE_NAME)?.value ?? null;
  }

  async write(cookie: SessionCookie): Promise<void> {
    (await cookies()).set(COOKIE_NAME, cookie.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.SESSION_COOKIE_SECURE === "true",
      path: "/",
      expires: cookie.expiresAt,
    });
  }

  async clear(): Promise<void> {
    (await cookies()).delete(COOKIE_NAME);
  }
}
