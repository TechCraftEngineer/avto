import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const accept = protectedProcedure
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
        message: "Нет доступа к этому проекту",
      });
    }

    const wasNew = response.status === "NEW";

    const [updated] = await context.db
      .update(responseTable)
      .set({
        status: "EVALUATED",
        hrSelectionStatus: "RECOMMENDED",
        updatedAt: new Date(),
      })
      .where(eq(responseTable.id, input.responseId))
      .returning();

    // Если статус был NEW, обновляем счетчик новых откликов
    if (wasNew) {
      await context.db
        .update(gig)
        .set({
          newResponses: sql`GREATEST(COALESCE(${gig.newResponses}, 0) - 1, 0)`,
        })
        .where(eq(gig.id, response.entityId));
    }

    return updated;
  });
