import type { LogoutUseCase } from "../../ports/in/auth";
import type { Authenticate } from "./authenticate";

export class Logout implements LogoutUseCase {
  constructor(private readonly auth: Authenticate) {}

  async execute(): Promise<void> {
    await this.auth.endSession();
  }
}
