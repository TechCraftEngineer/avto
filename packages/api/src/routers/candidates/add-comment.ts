import {
  and,
  eq,
  responseComment,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const addComment = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      candidateId: z.string(),
      content: z.string().min(1),
      isPrivate: z.boolean().default(true),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const [candidate] = await ctx.db
      .select({
        id: responseTable.id,
        vacancyId: responseTable.entityId,
      })
      .from(responseTable)
      .where(
        and(
          eq(responseTable.id, input.candidateId),
          eq(responseTable.entityType, "vacancy"),
        ),
      )
      .limit(1);

    if (!candidate) {
      throw new Error("Candidate not found");
    }

    const [vacancyRecord] = await ctx.db
      .select({
        workspaceId: vacancy.workspaceId,
      })
      .from(vacancy)
      .where(eq(vacancy.id, candidate.vacancyId))
      .limit(1);

    if (!vacancyRecord || vacancyRecord.workspaceId !== input.workspaceId) {
      throw new Error("Candidate not found");
    }

    const [comment] = await ctx.db
      .insert(responseComment)
      .values({
        responseId: input.candidateId,
        authorId: ctx.session.user.id,
        content: input.content,
        isPrivate: input.isPrivate,
      })
      .returning();

    if (!comment) {
      throw new Error("Failed to create comment");
    }

    return {
      id: comment.id,
      candidateId: comment.responseId,
      content: comment.content,
      isPrivate: comment.isPrivate,
      createdAt: comment.createdAt,
      author: ctx.session.user.name ?? "Unknown",
      authorAvatar: ctx.session.user.image,
    };
  });
