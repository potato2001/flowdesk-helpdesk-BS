import { z } from "zod";
import { MAX_PASSWORD_LENGTH } from "@/domain/user/password-policy";

/**
 * Boundary schemas check shape only. Password *strength* is a business rule and
 * is enforced in the domain, so the two cannot drift apart.
 */
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(MAX_PASSWORD_LENGTH),
  newPassword: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});
