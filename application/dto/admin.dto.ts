import type { TicketPriority } from "@/domain/ticket/ticket";

export type PageMetaDTO = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SlaPolicyDTO = {
  id: string;
  name: string;
  priority: TicketPriority;
  responseMinutes: number;
  resolutionMinutes: number;
  businessHoursOnly: boolean;
  active: boolean;
  updatedAt: string;
};
