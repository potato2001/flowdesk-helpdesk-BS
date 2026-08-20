import assert from "node:assert/strict";
import test from "node:test";
import {
  assertChangeAllowed,
  invalidatesSessions,
} from "../../domain/admin/user-administration.ts";

const admin = { id: "a1", role: "ADMIN", active: true };
const other = { id: "a2", role: "ADMIN", active: true };

test("an admin cannot disable or demote themselves", () => {
  assert.throws(
    () => assertChangeAllowed(admin, admin, { active: false }, 5),
    /tự vô hiệu hóa hoặc hạ quyền/,
  );
  assert.throws(
    () => assertChangeAllowed(admin, admin, { role: "AGENT" }, 5),
    /tự vô hiệu hóa hoặc hạ quyền/,
  );
});

test("the last active admin is protected from anyone", () => {
  assert.throws(
    () => assertChangeAllowed(admin, other, { role: "AGENT" }, 1),
    /ít nhất một Admin/,
  );
  // With a spare admin the same change is fine.
  assert.doesNotThrow(() =>
    assertChangeAllowed(admin, other, { role: "AGENT" }, 2),
  );
});

test("harmless edits are always allowed", () => {
  assert.doesNotThrow(() => assertChangeAllowed(admin, admin, {}, 1));
  assert.doesNotThrow(() =>
    assertChangeAllowed(admin, other, { role: "ADMIN" }, 1),
  );
});

test("security-relevant changes invalidate sessions", () => {
  assert.equal(invalidatesSessions(other, { active: false }), true);
  assert.equal(invalidatesSessions(other, { role: "AGENT" }), true);
  assert.equal(invalidatesSessions(other, { temporaryPassword: "x" }), true);
  assert.equal(invalidatesSessions(other, { role: "ADMIN" }), false);
  assert.equal(invalidatesSessions(other, { name: "Đổi tên" }), false);
});
