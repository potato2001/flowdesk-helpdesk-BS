import { forbidden } from "../errors";
import { canWriteInternalNotes, type Role } from "../user/role";

export type CommentVisibility = "PUBLIC" | "INTERNAL";

export type Comment = {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  visibility: CommentVisibility;
  createdAt: Date;
};

export function visibilityFor(internal: boolean): CommentVisibility {
  return internal ? "INTERNAL" : "PUBLIC";
}

export function assertCanWrite(role: Role, visibility: CommentVisibility) {
  if (visibility === "INTERNAL" && !canWriteInternalNotes(role))
    throw forbidden("Requester không thể tạo ghi chú nội bộ.");
}

/** Requesters never receive internal notes, whatever the query returned. */
export function visibleTo<T extends { visibility: CommentVisibility }>(
  role: Role,
  comments: readonly T[],
): T[] {
  return role === "REQUESTER"
    ? comments.filter((comment) => comment.visibility === "PUBLIC")
    : [...comments];
}
