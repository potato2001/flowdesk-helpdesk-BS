"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTicket,
  fetchTicket,
  fetchTickets,
  updateTicket,
  type CreateTicketBody,
  type UpdateTicketBody,
} from "../api/tickets.api";
import { fetchAssignableUsers, fetchSession } from "../api/users.api";
import { sessionKeys, ticketKeys, userKeys } from "../query-keys";

export function useSession() {
  return useQuery({
    queryKey: sessionKeys.current(),
    queryFn: ({ signal }) => fetchSession(signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useTickets(enabled = true) {
  return useQuery({
    queryKey: ticketKeys.lists(),
    queryFn: ({ signal }) => fetchTickets(signal),
    staleTime: 30_000,
    enabled,
  });
}

export function useTicket(ref: string | null) {
  return useQuery({
    queryKey: ticketKeys.detail(ref ?? "none"),
    queryFn: ({ signal }) => fetchTicket(ref!, signal),
    enabled: Boolean(ref),
    staleTime: 15_000,
  });
}

export function useAssignableUsers(enabled = true) {
  return useQuery({
    queryKey: userKeys.assignable(),
    queryFn: ({ signal }) => fetchAssignableUsers(signal),
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function useCreateTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTicketBody) => createTicket(body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ticketKeys.all });
      // Creating on behalf of a new person adds a user row.
      void client.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ ref, body }: { ref: string; body: UpdateTicketBody }) =>
      updateTicket(ref, body),
    onSuccess: (_ticket, { ref }) => {
      // The row changed and so did the list it appears in.
      void client.invalidateQueries({ queryKey: ticketKeys.detail(ref) });
      void client.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}
