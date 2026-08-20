import type { CheckHealthUseCase } from "../../ports/in/admin";
import type { HealthRepository } from "../../ports/out/repositories";

export class CheckHealth implements CheckHealthUseCase {
  constructor(private readonly health: HealthRepository) {}

  async execute() {
    try {
      await this.health.ping();
      return { status: "ok", database: "connected" } as const;
    } catch {
      return { status: "degraded", database: "disconnected" } as const;
    }
  }
}
