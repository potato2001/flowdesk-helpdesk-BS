import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("uses the self-hosted Next.js runtime", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.ok(packageJson.dependencies.next);
  for (const cloudDependency of ["vinext", "wrangler", "@openai/sites-vite-plugin", "@cloudflare/vite-plugin"]) {
    assert.equal(packageJson.dependencies[cloudDependency], undefined);
    assert.equal(packageJson.devDependencies[cloudDependency], undefined);
  }
});

test("local stack contains PostgreSQL, persistent uploads and Mailpit", async () => {
  const compose = await read("docker-compose.yml");
  assert.match(compose, /postgres:17-alpine/);
  assert.match(compose, /flowdesk_postgres/);
  assert.match(compose, /flowdesk_uploads/);
  assert.match(compose, /axllent\/mailpit/);
});

test("Prisma schema includes local authentication and helpdesk relations", async () => {
  const schema = await read("prisma/schema.prisma");
  for (const model of ["User", "Session", "Ticket", "Comment", "Attachment", "Activity", "SlaPolicy"]) assert.match(schema, new RegExp(`model ${model} \\{`));
  assert.match(schema, /passwordHash/);
  assert.match(schema, /tokenHash/);
  assert.match(schema, /responseDueAt/);
  assert.match(schema, /resolutionDueAt/);
});

test("routes stay thin and delegate to the interface-adapters layer", async () => {
  const routes = [
    "app/api/tickets/route.ts",
    "app/api/tickets/[id]/comments/route.ts",
    "app/api/tickets/[id]/attachments/route.ts",
    "app/api/admin/users/route.ts",
  ];
  for (const route of routes) {
    const source = await read(route);
    assert.match(source, /@\/interface-adapters\/http\/controllers\//);
    // A route must not reach past its controller into inner layers.
    assert.doesNotMatch(source, /@\/(application|domain|infrastructure)\//);
    assert.doesNotMatch(source, /getPrisma|PrismaClient/);
  }
});

test("controllers authenticate and enforce the upload limit in the domain", async () => {
  const [tickets, admin, attachment] = await Promise.all([
    read("interface-adapters/http/controllers/ticket.controller.ts"),
    read("interface-adapters/http/controllers/admin.controller.ts"),
    read("domain/ticket/attachment.ts"),
  ]);
  assert.match(tickets, /auth\.requireUser\(\)/);
  assert.match(admin, /auth\.requireUser\(\["ADMIN"\]\)/);
  assert.match(attachment, /MAX_ATTACHMENT_BYTES/);
});

test("the dependency rule points inward", async () => {
  // domain/ is the innermost layer and may not import anything above it.
  const domainFiles = [
    "domain/errors.ts",
    "domain/ticket/sla.ts",
    "domain/ticket/ticket-access.ts",
    "domain/user/account-lock.ts",
    "domain/user/password-policy.ts",
    "domain/admin/user-administration.ts",
  ];
  for (const file of domainFiles) {
    const source = await read(file);
    assert.doesNotMatch(
      source,
      /@\/(application|infrastructure|interface-adapters|app)\//,
      `${file} must not depend on an outer layer`,
    );
    assert.doesNotMatch(source, /from "(next|@prisma|bcryptjs|zod)/, `${file} must stay framework-free`);
  }

  // application/ may know the domain and its own ports, never a concrete adapter.
  for (const file of [
    "application/use-cases/auth/login.ts",
    "application/use-cases/tickets/create-ticket.ts",
    "application/use-cases/admin/update-user.ts",
  ]) {
    const source = await read(file);
    assert.doesNotMatch(source, /@\/(infrastructure|interface-adapters)\//);
    assert.doesNotMatch(source, /from "(next|@prisma|bcryptjs)/);
  }
});

test("infrastructure is the only layer that knows Prisma", async () => {
  const container = await read("infrastructure/container.ts");
  assert.match(container, /Prisma\w+Repository/);
  assert.match(container, /export function buildContainer\(\): Container/);
});
