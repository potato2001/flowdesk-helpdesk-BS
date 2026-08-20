import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getPrisma } from "../db/prisma";
import { HttpError } from "./http";

const COOKIE_NAME = "flowdesk_session";
const SESSION_DAYS = 7;
export type AppRole = "REQUESTER" | "AGENT" | "MANAGER" | "ADMIN";

function tokenHash(token: string) {
  return createHmac(
    "sha256",
    process.env.SESSION_SECRET ?? "flowdesk-local-dev",
  )
    .update(token)
    .digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await getPrisma().$transaction([
    getPrisma().session.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    }),
    getPrisma().session.create({
      data: { tokenHash: tokenHash(token), userId, expiresAt },
    }),
  ]);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SESSION_COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token)
    await getPrisma().session.deleteMany({
      where: { tokenHash: tokenHash(token) },
    });
  store.delete(COOKIE_NAME);
}

export async function destroyAllSessions(userId: string) {
  await getPrisma().session.deleteMany({ where: { userId } });
  (await cookies()).delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await getPrisma().session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.active)
    return null;
  return session.user;
}

export async function requireUser(roles?: AppRole[]) {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Bạn cần đăng nhập.");
  if (roles && !roles.includes(user.role))
    throw new HttpError(403, "Bạn không có quyền thực hiện thao tác này.");
  return user;
}

export function canAccessTicket(
  user: { id: string; role: AppRole },
  ticket: { requesterId: string; assigneeId: string | null },
) {
  if (user.role === "REQUESTER") return ticket.requesterId === user.id;
  if (user.role === "AGENT")
    return !ticket.assigneeId || ticket.assigneeId === user.id;
  return true;
}
