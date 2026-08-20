import assert from "node:assert/strict";
import test from "node:test";
import {
  LOCK_MINUTES,
  MAX_FAILED_ATTEMPTS,
  clearedLock,
  isLocked,
  registerFailure,
} from "../../domain/user/account-lock.ts";

const now = new Date("2026-01-01T00:00:00.000Z");

test("failures accumulate without locking until the threshold", () => {
  let state = { failedLoginAttempts: 0, lockedUntil: null };
  for (let attempt = 1; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
    state = registerFailure(state, now);
    assert.equal(state.failedLoginAttempts, attempt);
    assert.equal(state.lockedUntil, null);
  }
});

test("the threshold attempt locks the account and resets the counter", () => {
  const state = registerFailure(
    { failedLoginAttempts: MAX_FAILED_ATTEMPTS - 1, lockedUntil: null },
    now,
  );
  assert.equal(state.failedLoginAttempts, 0);
  assert.equal(
    state.lockedUntil.getTime() - now.getTime(),
    LOCK_MINUTES * 60_000,
  );
});

test("a lock expires exactly at its deadline", () => {
  const lockedUntil = new Date(now.getTime() + LOCK_MINUTES * 60_000);
  assert.equal(isLocked({ failedLoginAttempts: 0, lockedUntil }, now), true);
  assert.equal(isLocked({ failedLoginAttempts: 0, lockedUntil }, lockedUntil), false);
  assert.equal(isLocked({ failedLoginAttempts: 0, lockedUntil: null }, now), false);
});

test("clearing produces an unlocked state", () => {
  assert.deepEqual(clearedLock(), {
    failedLoginAttempts: 0,
    lockedUntil: null,
  });
});
