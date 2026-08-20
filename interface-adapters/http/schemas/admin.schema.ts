import { z } from "zod";
import { ROLES } from "@/domain/user/role";
import { MAX_PASSWORD_LENGTH } from "@/domain/user/password-policy";

const password = z.string().min(1).max(MAX_PASSWORD_LENGTH);

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(2).max(120),
  role: z.enum(ROLES),
  department: z.string().trim().max(120).optional().nullable(),
  temporaryPassword: password,
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.enum(ROLES).optional(),
    department: z.string().trim().max(120).nullable().optional(),
    active: z.boolean().optional(),
    unlock: z.boolean().optional(),
    temporaryPassword: password.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Không có thay đổi nào được gửi lên.",
  });

/**
 * List query parsing. Numbers arrive as strings on the URL, so they are
 * coerced here rather than in the use case.
 */
export const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const listUsersQuerySchema = pageQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
  role: z.enum(ROLES).optional(),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const listAuditQuerySchema = pageQuerySchema.extend({
  action: z.string().trim().max(100).optional(),
  actorId: z.uuid().optional(),
});

export const updateSlaPolicySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  responseMinutes: z.number().int().optional(),
  resolutionMinutes: z.number().int().optional(),
  businessHoursOnly: z.boolean().optional(),
  active: z.boolean().optional(),
});
