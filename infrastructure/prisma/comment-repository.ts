import type {
  CommentRepository,
  CommentWithAuthor,
  NewComment,
} from "@/application/ports/out/repositories";
import { getPrisma } from "./client";
import { toCommentWithAuthor } from "./mappers";

export class PrismaCommentRepository implements CommentRepository {
  /** The comment and its activity entry are written together. */
  async create(
    comment: NewComment,
    activitySummary: string,
  ): Promise<CommentWithAuthor> {
    const row = await getPrisma().$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: comment,
        include: { author: true },
      });
      await tx.activity.create({
        data: {
          ticketId: comment.ticketId,
          actorId: comment.authorId,
          type: "COMMENT_ADDED",
          summary: activitySummary,
        },
      });
      return created;
    });
    return toCommentWithAuthor(row);
  }
}
