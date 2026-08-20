import { NextResponse } from "next/server";
import { buildContainer } from "@/infrastructure/container";
import { invalidInput } from "@/domain/errors";
import { handle } from "../error-mapper";
import {
  addCommentSchema,
  createTicketSchema,
  updateTicketSchema,
} from "../schemas/ticket.schema";

type RouteContext = { params: Promise<{ id: string }> };

export function listTickets() {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser();
    const tickets = await app.listTickets.execute({ actor });
    return NextResponse.json({ tickets });
  });
}

export function createTicket(request: Request) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser();
    const input = createTicketSchema.parse(await request.json());
    const ticket = await app.createTicket.execute({
      actor,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      assigneeId: input.assigneeId ?? null,
      requester: input.requester
        ? input.requester.kind === "new"
          ? { ...input.requester, department: input.requester.department ?? null }
          : input.requester
        : undefined,
    });
    return NextResponse.json({ ticket }, { status: 201 });
  });
}

export function getTicket(context: RouteContext) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser();
    const { id } = await context.params;
    const ticket = await app.getTicket.execute({ actor, ref: id });
    return NextResponse.json({ ticket });
  });
}

export function updateTicket(request: Request, context: RouteContext) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser(["AGENT", "MANAGER", "ADMIN"]);
    const { id } = await context.params;
    const input = updateTicketSchema.parse(await request.json());
    const ticket = await app.updateTicket.execute({
      actor,
      ref: id,
      status: input.status,
      assigneeId: input.assigneeId,
    });
    return NextResponse.json({ ticket });
  });
}

export function addComment(request: Request, context: RouteContext) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser();
    const { id } = await context.params;
    const input = addCommentSchema.parse(await request.json());
    const comment = await app.addComment.execute({
      actor,
      ref: id,
      body: input.body,
      internal: input.internal,
    });
    return NextResponse.json({ comment }, { status: 201 });
  });
}

export function addAttachment(request: Request, context: RouteContext) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser();
    const { id } = await context.params;
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) throw invalidInput("Vui lòng chọn file.");
    const attachment = await app.addAttachment.execute({
      actor,
      ref: id,
      fileName: file.name,
      mimeType: file.type,
      content: new Uint8Array(await file.arrayBuffer()),
    });
    return NextResponse.json({ attachment }, { status: 201 });
  });
}

export function downloadAttachment(context: RouteContext) {
  return handle(async () => {
    const app = buildContainer();
    const actor = await app.auth.requireUser();
    const { id } = await context.params;
    const file = await app.downloadAttachment.execute({
      actor,
      attachmentId: id,
    });
    return new Response(file.content as BodyInit, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.sizeBytes),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  });
}
