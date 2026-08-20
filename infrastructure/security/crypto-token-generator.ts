import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { TokenGenerator } from "@/application/ports/out/services";

/**
 * Session tokens are random and never stored; only a keyed digest is persisted,
 * so a database leak does not yield usable session tokens.
 */
export class CryptoTokenGenerator implements TokenGenerator {
  createToken(): string {
    return randomBytes(32).toString("base64url");
  }

  hashToken(token: string): string {
    return createHmac(
      "sha256",
      process.env.SESSION_SECRET ?? "flowdesk-local-dev",
    )
      .update(token)
      .digest("hex");
  }

  createId(): string {
    return randomUUID();
  }
}
