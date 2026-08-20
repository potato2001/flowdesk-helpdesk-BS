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

test("server routes enforce authentication for local data operations", async () => {
  const [tickets, comments, attachments] = await Promise.all([
    read("app/api/tickets/route.ts"),
    read("app/api/tickets/[id]/comments/route.ts"),
    read("app/api/tickets/[id]/attachments/route.ts"),
  ]);
  assert.match(tickets, /requireUser\(\)/);
  assert.match(comments, /assertTicketAccess/);
  assert.match(attachments, /MAX_FILE_SIZE/);
});
