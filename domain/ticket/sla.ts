import type { TicketPriority } from "./ticket";

/**
 * Fallback response/resolution windows in minutes, used when no SlaPolicy row
 * exists for a priority. Deadlines are materialised when the ticket is raised.
 */
export const DEFAULT_RESPONSE_MINUTES = 240;
export const DEFAULT_RESOLUTION_MINUTES = 960;

export type SlaWindow = {
  responseMinutes: number;
  resolutionMinutes: number;
};

export const DEFAULT_SLA: SlaWindow = {
  responseMinutes: DEFAULT_RESPONSE_MINUTES,
  resolutionMinutes: DEFAULT_RESOLUTION_MINUTES,
};

export type SlaDeadlines = {
  responseDueAt: Date;
  resolutionDueAt: Date;
};

export function deadlinesFrom(
  now: Date,
  window: SlaWindow | null | undefined,
): SlaDeadlines {
  const { responseMinutes, resolutionMinutes } = window ?? DEFAULT_SLA;
  return {
    responseDueAt: new Date(now.getTime() + responseMinutes * 60_000),
    resolutionDueAt: new Date(now.getTime() + resolutionMinutes * 60_000),
  };
}

/**
 * Minutes left before a deadline, floored at zero. A satisfied deadline
 * (first response recorded, or ticket complete) reports zero.
 */
export function remainingMinutes(
  dueAt: Date,
  now: Date,
  satisfied = false,
): number {
  if (satisfied) return 0;
  return Math.max(0, Math.ceil((dueAt.getTime() - now.getTime()) / 60_000));
}

export function isBreached(dueAt: Date, now: Date, satisfied = false) {
  return !satisfied && dueAt.getTime() < now.getTime();
}

/** Unused priorities fall back to the default window. */
export function windowFor(
  policies: ReadonlyMap<TicketPriority, SlaWindow>,
  priority: TicketPriority,
): SlaWindow {
  return policies.get(priority) ?? DEFAULT_SLA;
}
