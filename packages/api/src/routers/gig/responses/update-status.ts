import { and, eq, sql } from "@qbs-autonaim/db";
import {
  gig,
  gigHrSelectionStatusValues,
  responseStatusValues,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const updateStatus = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      workspaceId: workspaceIdSchema,
      status: z.enum(responseStatusValues).optional(),
      hrSelectionStatus: z.enum(gigHrSelectionStatusValues).optional(),
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

    const patch: {
      status?: (typeof responseStatusValues)[number];
      hrSelectionStatus?: (typeof gigHrSelectionStatusValues)[number];
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (input.status !== undefined) {
      patch.status = input.status;
    }
    if (input.hrSelectionStatus !== undefined) {
      patch.hrSelectionStatus = input.hrSelectionStatus;
    }

    const [updated] = await ctx.db
      .update(responseTable)
      .set(patch)
      .where(eq(responseTable.id, input.responseId))
      .returning();

    // Обновляем счетчик новых откликов, если статус изменился
    if (input.status !== undefined && response.status !== input.status) {
      const wasNew = response.status === "NEW";
      const isNew = input.status === "NEW";

      if (wasNew && !isNew) {
        // Отклик перестал быть новым - уменьшаем счетчик
        await ctx.db
          .update(gig)
          .set({
            newResponses: sql`GREATEST(COALESCE(${gig.newResponses}, 0) - 1, 0)`,
          })
          .where(eq(gig.id, response.entityId));
      } else if (!wasNew && isNew) {
        // Отклик стал новым - увеличиваем счетчик
        await ctx.db
          .update(gig)
          .set({
            newResponses: sql`COALESCE(${gig.newResponses}, 0) + 1`,
          })
          .where(eq(gig.id, response.entityId));
      }
    }

    return updated;
  });
