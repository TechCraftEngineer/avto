import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const deleteResponse = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    const wasNew = response.status === "NEW";

    // Удаляем отклик
    await context.db
      .delete(responseTable)
      .where(eq(responseTable.id, input.responseId));

    // Обновляем счетчики в gig
    await context.db
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
