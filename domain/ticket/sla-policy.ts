import { invalidInput } from "../errors";

/**
 * Bounds on an SLA policy. A resolution window shorter than its response
 * window is nonsense — the ticket would be due to be solved before anyone is
 * due to have looked at it — so it is rejected rather than stored.
 */
export const MIN_SLA_MINUTES = 5;
export const MAX_SLA_MINUTES = 60 * 24 * 30;

export function assertSlaWindow(
  responseMinutes: number,
  resolutionMinutes: number,
) {
  for (const [label, value] of [
    ["phản hồi", responseMinutes],
    ["giải quyết", resolutionMinutes],
  ] as const) {
    if (!Number.isInteger(value))
      throw invalidInput(`Thời gian ${label} phải là số nguyên phút.`);
    if (value < MIN_SLA_MINUTES || value > MAX_SLA_MINUTES)
      throw invalidInput(
        `Thời gian ${label} phải nằm trong khoảng ${MIN_SLA_MINUTES}–${MAX_SLA_MINUTES} phút.`,
      );
  }
  if (resolutionMinutes < responseMinutes)
    throw invalidInput(
      "Thời gian giải quyết không thể ngắn hơn thời gian phản hồi.",
    );
}
