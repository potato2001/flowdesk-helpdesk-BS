import type { Clock } from "@/application/ports/out/services";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
