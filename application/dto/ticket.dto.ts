/**
 * The ticket shape the UI consumes. Enum values are already lowered to the
 * vocabulary the client uses, and SLA figures are pre-computed minutes, so no
 * consumer needs to know the domain enums or the current time.
 */
export type UiTicketStatus = "new" | "progress" | "waiting" | "resolved";
export type UiTicketPriority = "low" | "medium" | "high";

export type CommentDTO = {
  id: string;
  author: string;
  initials: string;
  body: string;
  time: string;
  internal: boolean;
};

export type ActivityDTO = {
  id: string;
  text: string;
  actor: string;
  time: string;
};

export type AttachmentDTO = {
  id: string;
  name: string;
  sizeBytes: number;
  author: string;
  time: string;
  downloadUrl: string;
};

export type TicketDTO = {
  databaseId: string;
  id: string;
  title: string;
  description: string;
  requester: string;
  requesterEmail: string;
  department: string;
  status: UiTicketStatus;
  priority: UiTicketPriority;
  category: string;
  assignee: string;
  assigneeId: string | null;
  initials: string;
  responseSla: number;
  resolutionSla: number;
  createdAt: string;
  comments: CommentDTO[];
  activities: ActivityDTO[];
  attachments: AttachmentDTO[];
};

export type AttachmentDownloadDTO = {
  content: Uint8Array;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};
