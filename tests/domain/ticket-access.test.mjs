import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessTicket,
  scopeFor,
} from "../../domain/ticket/ticket-access.ts";
import { parseTicketRef, formatTicketRef } from "../../domain/ticket/ticket-ref.ts";

const ticket = (requesterId, assigneeId = null) => ({ requesterId, assigneeId });

test("a requester reaches only the tickets they raised", () => {
  const actor = { id: "u1", role: "REQUESTER" };
  assert.equal(canAccessTicket(actor, ticket("u1")), true);
  assert.equal(canAccessTicket(actor, ticket("u2")), false);
  // Even when it is assigned to them, a requester still needs to own it.
  assert.equal(canAccessTicket(actor, ticket("u2", "u1")), false);
});

test("an agent reaches their own queue plus anything unassigned", () => {
  const actor = { id: "a1", role: "AGENT" };
  assert.equal(canAccessTicket(actor, ticket("u1", null)), true);
  assert.equal(canAccessTicket(actor, ticket("u1", "a1")), true);
  assert.equal(canAccessTicket(actor, ticket("u1", "a2")), false);
});

test("managers and admins reach everything", () => {
  for (const role of ["MANAGER", "ADMIN"])
    assert.equal(canAccessTicket({ id: "x", role }, ticket("u1", "a2")), true);
});

test("the list scope mirrors the row rule", () => {
  assert.deepEqual(scopeFor({ id: "u1", role: "REQUESTER" }), {
    kind: "requested-by",
    userId: "u1",
  });
  assert.deepEqual(scopeFor({ id: "a1", role: "AGENT" }), {
    kind: "assigned-to-or-unassigned",
    userId: "a1",
  });
  assert.deepEqual(scopeFor({ id: "m1", role: "MANAGER" }), { kind: "all" });
});

test("ticket refs round-trip and reject junk", () => {
  assert.equal(formatTicketRef(1038), "HD-1038");
  assert.equal(parseTicketRef("HD-1038"), 1038);
  assert.equal(parseTicketRef("hd-7"), 7);
  for (const bad of ["HD-abc", "HD-1.5", "HD--3", ""])
    assert.throws(() => parseTicketRef(bad), /Mã ticket không hợp lệ/);
});
