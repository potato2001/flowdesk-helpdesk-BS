"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { TicketPriority } from "@/domain/ticket/ticket";
import {
  createUser,
  fetchAdminUsers,
  fetchAuditLogs,
  fetchSlaPolicies,
  updateSlaPolicy,
  updateUser,
  type AdminUserQuery,
  type AuditQuery,
  type CreateUserBody,
  type UpdateSlaPolicyBody,
  type UpdateUserBody,
} from "../api/users.api";
import { auditKeys, slaKeys, ticketKeys, userKeys } from "../query-keys";

/**
 * One invalidation helper per domain, called by every mutation's onSuccess
 * (mut-invalidate-queries). Keeping them here means a new mutation cannot
 * forget a surface that displays the same data.
 */
function invalidateUsers(client: QueryClient) {
  // Admin lists, the assignable-agent picker, and tickets (which embed the
  // requester/assignee name) all go stale when a user changes.
  void client.invalidateQueries({ queryKey: userKeys.all });
  void client.invalidateQueries({ queryKey: ticketKeys.all });
  void client.invalidateQueries({ queryKey: auditKeys.all });
}

function invalidateSla(client: QueryClient) {
  void client.invalidateQueries({ queryKey: slaKeys.all });
  void client.invalidateQueries({ queryKey: auditKeys.all });
}

export function useAdminUsers(query: AdminUserQuery) {
  return useQuery({
    queryKey: userKeys.adminList(query),
    queryFn: ({ signal }) => fetchAdminUsers(query, signal),
    // Account state changes on admin action, not on its own.
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}

export function useAuditLogs(query: AuditQuery) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: ({ signal }) => fetchAuditLogs(query, signal),
    // Audit rows arrive on every login; keep them fresher than user rows.
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  });
}

export function useSlaPolicies() {
  return useQuery({
    queryKey: slaKeys.list(),
    queryFn: ({ signal }) => fetchSlaPolicies(signal),
    // Reference data — edited rarely, by an admin, deliberately.
    staleTime: 10 * 60_000,
  });
}

export function useCreateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserBody) => createUser(body),
    onSuccess: () => invalidateUsers(client),
  });
}

export function useUpdateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserBody }) =>
      updateUser(id, body),
    onSuccess: () => invalidateUsers(client),
  });
}

export function useUpdateSlaPolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      priority,
      body,
    }: {
      priority: TicketPriority;
      body: UpdateSlaPolicyBody;
    }) => updateSlaPolicy(priority, body),
    onSuccess: () => invalidateSla(client),
  });
}
