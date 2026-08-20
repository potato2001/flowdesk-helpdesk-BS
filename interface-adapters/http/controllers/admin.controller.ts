import { NextResponse } from "next/server";
import { buildContainer } from "@/infrastructure/container";
import { handle } from "../error-mapper";
import { clientIp } from "../request-context";
import {
  createUserSchema,
  listAuditQuerySchema,
  listUsersQuerySchema,
  updateSlaPolicySchema,
  updateUserSchema,
} from "../schemas/admin.schema";
import { TICKET_PRIORITIES } from "@/domain/ticket/ticket";
import { invalidInput } from "@/domain/errors";

/** Query strings arrive as a flat record; zod does the coercion. */
function query(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams);
}

export function listUsers(request: Request) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser(["ADMIN"]);
    const input = listUsersQuerySchema.parse(query(request));
    // Spread the result: the envelope is { users, meta }, never { users: {...} }.
    return NextResponse.json(await app.listUsers.execute({ actor, ...input }));
  });
}

export function createUser(request: Request) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser(["ADMIN"]);
    const input = createUserSchema.parse(await request.json());
    const user = await app.createUser.execute({
      actor,
      email: input.email,
      name: input.name,
      role: input.role,
      department: input.department ?? null,
      temporaryPassword: input.temporaryPassword,
      ipAddress: clientIp(request),
    });
    return NextResponse.json({ user }, { status: 201 });
  });
}

export function updateUser(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser(["ADMIN"]);
    const { id } = await context.params;
    const input = updateUserSchema.parse(await request.json());
    const user = await app.updateUser.execute({
      actor,
      targetId: id,
      ...input,
      ipAddress: clientIp(request),
    });
    return NextResponse.json({ user });
  });
}

export function listAuditLogs(request: Request) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser(["ADMIN"]);
    const input = listAuditQuerySchema.parse(query(request));
    return NextResponse.json(
      await app.listAuditLogs.execute({ actor, ...input }),
    );
  });
}

export function listSlaPolicies() {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser(["ADMIN"]);
    return NextResponse.json({
      policies: await app.listSlaPolicies.execute({ actor }),
    });
  });
}

export function updateSlaPolicy(
  request: Request,
  context: { params: Promise<{ priority: string }> },
) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser(["ADMIN"]);
    const { priority } = await context.params;
    const parsed = TICKET_PRIORITIES.find(
      (value) => value === priority.toUpperCase(),
    );
    if (!parsed) throw invalidInput("Mức ưu tiên không hợp lệ.");
    const input = updateSlaPolicySchema.parse(await request.json());
    const policy = await app.updateSlaPolicy.execute({
      actor,
      priority: parsed,
      ...input,
      ipAddress: clientIp(request),
    });
    return NextResponse.json({ policy });
  });
}

export function listAssignableUsers() {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser(["AGENT", "MANAGER", "ADMIN"]);
    return NextResponse.json({
      users: await app.listAssignableUsers.execute({ actor }),
    });
  });
}

export function checkHealth() {
  return handle(async () => {
    const result = await buildContainer().checkHealth.execute();
    return NextResponse.json(result, {
      status: result.status === "ok" ? 200 : 503,
    });
  });
}
