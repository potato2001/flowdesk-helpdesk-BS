import { compare, hash } from "bcryptjs";
import type { PasswordHasher } from "@/application/ports/out/services";

const COST = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return hash(plain, COST);
  }

  verify(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
