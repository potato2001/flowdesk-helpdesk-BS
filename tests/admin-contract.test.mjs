import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

/**
 * The envelope contract. Paged admin endpoints return `{ <plural>, meta }` —
 * a plural key alongside meta, never a nested `{ users: { users, meta } }`.
 * That mistake type-checks and returns 200 while silently breaking paging,
 * so it is pinned here.
 */
test("paged admin controllers spread the use-case result", async () => {
  const source = await read(
    "interface-adapters/http/controllers/admin.controller.ts",
  );
  for (const call of ["listUsers.execute", "listAuditLogs.execute"]) {
    const line = source
      .split("\n")
      .find((text) => text.includes(call));
    assert.ok(line, `${call} not found`);
  }
  // The result object is passed straight to json(), not re-wrapped in a key.
  assert.match(
    source,
    /NextResponse\.json\(await app\.listUsers\.execute\(/,
    "listUsers must return the { users, meta } envelope unwrapped",
  );
  assert.match(
    source,
    /NextResponse\.json\(\s*await app\.listAuditLogs\.execute\(/,
    "listAuditLogs must return the { logs, meta, actions } envelope unwrapped",
  );
});

test("client paging types mirror the server envelope", async () => {
  const source = await read("client/api/users.api.ts");
  assert.match(source, /AdminUserPage = \{ users: AdminUserDTO\[\]; meta: PageMetaDTO \}/);
  assert.match(source, /logs: AuditLogDTO\[\];\s*meta: PageMetaDTO;\s*actions: string\[\];/);
});

test("page size is clamped so a hostile query cannot dump the table", async () => {
  const source = await read("application/use-cases/paging.ts");
  assert.match(source, /MAX_PAGE_SIZE/);
  assert.match(source, /Math\.min\(MAX_PAGE_SIZE/);
});

test("admin screens share one table and one dialog convention", async () => {
  for (const screen of [
    "components/admin/AdminUsers.tsx",
    "components/admin/AdminSlaPolicies.tsx",
    "components/admin/AdminTickets.tsx",
    "components/admin/AdminAuditLog.tsx",
  ]) {
    const source = await read(screen);
    assert.match(source, /from "\.\/DataTable"/, `${screen} must use DataTable`);
    assert.match(
      source,
      /from "\.\/AdminPageHeading"/,
      `${screen} must use the shared heading`,
    );
    // Screens read data through hooks, never by calling fetch directly.
    assert.doesNotMatch(source, /\bfetch\(/, `${screen} must not call fetch directly`);
  }
});

test("every mutation hook invalidates related queries", async () => {
  const source = await read("client/queries/admin.queries.ts");
  const mutations = [...source.matchAll(/useMutation\(\{/g)];
  const successes = [...source.matchAll(/onSuccess:/g)];
  assert.equal(
    mutations.length,
    successes.length,
    "each useMutation must declare onSuccess to invalidate its queries",
  );
});
