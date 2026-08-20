import type { PageRequest } from "../ports/out/repositories";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Clamps client-supplied paging so a hostile page size cannot dump the table. */
export function resolvePage(query: {
  page?: number;
  pageSize?: number;
}): PageRequest {
  const page = Math.max(1, Math.trunc(query.page ?? 1));
  const requested = Math.trunc(query.pageSize ?? DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requested));
  return { page, pageSize };
}
