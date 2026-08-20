/**
 * Query key factory (qk-factory-pattern). Every key in the app is defined here
 * so invalidation is discoverable and typo-free, and keys stay hierarchical:
 * entity → id → sub-resource (qk-hierarchical-organization).
 */
export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (ref: string) => [...ticketKeys.details(), ref] as const,
};

export const sessionKeys = {
  all: ["session"] as const,
  current: () => [...sessionKeys.all, "current"] as const,
};

export const userKeys = {
  all: ["users"] as const,
  assignable: () => [...userKeys.all, "assignable"] as const,
  admin: () => [...userKeys.all, "admin"] as const,
  /** Filters belong in the key, or pages would share one cache entry. */
  adminList: (query: Record<string, unknown>) =>
    [...userKeys.admin(), query] as const,
};

export const slaKeys = {
  all: ["sla-policies"] as const,
  list: () => [...slaKeys.all, "list"] as const,
};

export const auditKeys = {
  all: ["audit"] as const,
  recent: () => [...auditKeys.all, "recent"] as const,
  list: (query: Record<string, unknown>) =>
    [...auditKeys.all, "list", query] as const,
};
