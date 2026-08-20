import assert from "node:assert/strict";
import test from "node:test";
import {
  assertCanWrite,
  visibilityFor,
  visibleTo,
} from "../../domain/ticket/comment.ts";

const comments = [
  { id: "1", visibility: "PUBLIC" },
  { id: "2", visibility: "INTERNAL" },
];

test("requesters never receive internal notes", () => {
  assert.deepEqual(
    visibleTo("REQUESTER", comments).map((c) => c.id),
    ["1"],
  );
});

test("staff receive every comment", () => {
  for (const role of ["AGENT", "MANAGER", "ADMIN"])
    assert.equal(visibleTo(role, comments).length, 2);
});

test("requesters cannot author internal notes", () => {
  assert.throws(
    () => assertCanWrite("REQUESTER", "INTERNAL"),
    /không thể tạo ghi chú nội bộ/,
  );
  assert.doesNotThrow(() => assertCanWrite("REQUESTER", "PUBLIC"));
  assert.doesNotThrow(() => assertCanWrite("AGENT", "INTERNAL"));
});

test("the internal flag maps to a visibility", () => {
  assert.equal(visibilityFor(true), "INTERNAL");
  assert.equal(visibilityFor(false), "PUBLIC");
});
