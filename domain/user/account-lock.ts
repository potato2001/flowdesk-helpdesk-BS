/**
 * Brute-force policy: a run of failed sign-ins locks the account for a
 * cooling-off window. The counter resets once the lock is applied.
 */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export type LockState = {
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

export function isLocked(state: LockState, now: Date) {
  return Boolean(state.lockedUntil && state.lockedUntil > now);
}

/** Next lock state after one failed attempt. */
export function registerFailure(state: LockState, now: Date): LockState {
  const attempts = state.failedLoginAttempts + 1;
  if (attempts < MAX_FAILED_ATTEMPTS)
    return { failedLoginAttempts: attempts, lockedUntil: null };
  return {
    failedLoginAttempts: 0,
    lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000),
  };
}

export function clearedLock(): LockState {
  return { failedLoginAttempts: 0, lockedUntil: null };
}
