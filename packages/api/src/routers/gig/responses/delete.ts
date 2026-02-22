import { and, eq, sql } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const deleteResponse = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const wasNew = response.status === "NEW";

    // Удаляем отклик
    await ctx.db
      .delete(responseTable)
      .where(eq(responseTable.id, input.responseId));

    // Обновляем счетчики в gig
    await ctx.db
      .update(gig)
      .set({
        responses: sql`GREATEST(COALESCE(${gig.responses}, 0) - 1, 0)`,
        newResponses: wasNew
          ? sql`GREATEST(COALESCE(${gig.newResponses}, 0) - 1, 0)`
          : sql`${gig.newResponses}`,
      })
      .where(eq(gig.id, response.entityId));

    return { success: true };
  });
