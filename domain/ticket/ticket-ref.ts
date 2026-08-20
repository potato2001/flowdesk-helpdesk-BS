import { invalidInput } from "../errors";

/**
 * Tickets are addressed as `HD-<number>` in URLs and in the UI, while the store
 * keys them by the integer `number`. This is the only place that translates.
 */
const PREFIX = "HD-";

export function formatTicketRef(number: number) {
  return `${PREFIX}${number}`;
}

export function parseTicketRef(ref: string): number {
  const value = Number(ref.replace(/^HD-/i, ""));
  if (!Number.isInteger(value) || value <= 0)
    throw invalidInput("Mã ticket không hợp lệ.");
  return value;
}
