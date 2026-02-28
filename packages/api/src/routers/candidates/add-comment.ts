import { ORPCError } from "@orpc/server";
import {
  and,
  eq,
  responseComment,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { verifyWorkspaceAccess } from "../../utils/verify-workspace-access";

export const addComment = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      candidateId: z.uuid({ error: "Некорректный формат ID кандидата" }),
      content: z.string().min(1),
      isPrivate: z.boolean().default(true),
    }),
  )
  .handler(async ({ input, context }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const [candidate] = await context.db
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
      throw new ORPCError("NOT_FOUND", { message: "Кандидат не найден" });
    }

    const [vacancyRecord] = await context.db
      .select({
        workspaceId: vacancy.workspaceId,
      })
      .from(vacancy)
      .where(eq(vacancy.id, candidate.vacancyId))
      .limit(1);

    if (!vacancyRecord || vacancyRecord.workspaceId !== input.workspaceId) {
      throw new ORPCError("NOT_FOUND", { message: "Кандидат не найден" });
    }

    const [comment] = await context.db
      .insert(responseComment)
      .values({
        responseId: input.candidateId,
        authorId: context.session.user.id,
        content: input.content,
        isPrivate: input.isPrivate,
      })
      .returning();

    if (!comment) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось создать комментарий",
      });
    }

    return {
      id: comment.id,
      candidateId: comment.responseId,
      content: comment.content,
      isPrivate: comment.isPrivate,
      createdAt: comment.createdAt,
      author: context.session.user.name ?? "Unknown",
      authorAvatar: context.session.user.image,
    };
  });
