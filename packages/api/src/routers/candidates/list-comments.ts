import { ORPCError } from "@orpc/server";
import {
  and,
  desc,
  eq,
  responseComment,
  response as responseTable,
  user,
  vacancy,
} from "@qbs-autonaim/db";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const listComments = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      candidateId: uuidv7Schema,
    }),
  )
  .query(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const comments = await ctx.db
      .select({
        id: responseComment.id,
        responseId: responseComment.responseId,
        content: responseComment.content,
        isPrivate: responseComment.isPrivate,
        createdAt: responseComment.createdAt,
        authorId: user.id,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(responseComment)
      .innerJoin(
        responseTable,
        eq(responseComment.responseId, responseTable.id),
      )
      .innerJoin(vacancy, eq(responseTable.entityId, vacancy.id))
      .innerJoin(user, eq(responseComment.authorId, user.id))
      .where(
        and(
          eq(responseTable.id, input.candidateId),
          eq(responseTable.entityType, "vacancy"),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .orderBy(desc(responseComment.createdAt));

    return comments.map((comment) => ({
      id: comment.id,
      candidateId: comment.responseId,
      content: comment.content,
      isPrivate: comment.isPrivate,
      createdAt: comment.createdAt,
      author: comment.authorName,
      authorAvatar: comment.authorImage,
    }));
  });
