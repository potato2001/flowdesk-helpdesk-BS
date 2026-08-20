import { NextResponse } from "next/server";
import { toSessionUserDTO } from "@/application/mappers/user.mapper";
import { buildContainer } from "@/infrastructure/container";
import { handle } from "../error-mapper";
import { clientIp } from "../request-context";
import { changePasswordSchema, loginSchema } from "../schemas/auth.schema";

export function login(request: Request) {
  return handle(async () => {
    const app = buildContainer();
    const input = loginSchema.parse(await request.json());
    const user = await app.login.execute({
      email: input.email,
      password: input.password,
      ipAddress: clientIp(request),
    });
    return NextResponse.json({ user });
  });
}

export function logout() {
  return handle(async () => {
    await buildContainer().logout.execute();
    return NextResponse.json({ ok: true });
  });
}

export function currentUser() {
  return handle(async () => {
    const user = await buildContainer().auth.requireUser();
    return NextResponse.json({ user: toSessionUserDTO(user) });
  });
}

export function changePassword(request: Request) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser();
    const input = changePasswordSchema.parse(await request.json());
    await app.changePassword.execute({
      actor,
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      ipAddress: clientIp(request),
    });
    return NextResponse.json({ success: true });
  });
}
