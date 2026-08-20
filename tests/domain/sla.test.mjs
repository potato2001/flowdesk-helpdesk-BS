import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SLA,
  deadlinesFrom,
  isBreached,
  remainingMinutes,
} from "../../domain/ticket/sla.ts";

const now = new Date("2026-01-01T00:00:00.000Z");

test("falls back to the default window when no policy exists", () => {
  const { responseDueAt, resolutionDueAt } = deadlinesFrom(now, null);
  assert.equal(responseDueAt.getTime() - now.getTime(), 240 * 60_000);
  assert.equal(resolutionDueAt.getTime() - now.getTime(), 960 * 60_000);
  assert.deepEqual(DEFAULT_SLA, {
    responseMinutes: 240,
    resolutionMinutes: 960,
  });
});

test("uses the policy window when one is supplied", () => {
  const { responseDueAt } = deadlinesFrom(now, {
    responseMinutes: 30,
    resolutionMinutes: 60,
  });
  assert.equal(responseDueAt.getTime() - now.getTime(), 30 * 60_000);
});

test("remaining minutes round up and never go negative", () => {
  const due = new Date(now.getTime() + 90 * 1000);
  assert.equal(remainingMinutes(due, now), 2);
  const past = new Date(now.getTime() - 60 * 60_000);
  assert.equal(remainingMinutes(past, now), 0);
});

test("a satisfied deadline reports zero regardless of the clock", () => {
  const due = new Date(now.getTime() + 10 * 60_000);
  assert.equal(remainingMinutes(due, now, true), 0);
  assert.equal(isBreached(new Date(now.getTime() - 1), now, true), false);
});

test("an unmet deadline in the past is breached", () => {
  assert.equal(isBreached(new Date(now.getTime() - 1), now), true);
  assert.equal(isBreached(new Date(now.getTime() + 1), now), false);
});
