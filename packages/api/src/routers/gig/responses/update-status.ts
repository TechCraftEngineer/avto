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
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому workspace", });
    }

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден", });
    }

    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому отклику", });
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

    const [updated] = await context.db
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
        await context.db
          .update(gig)
          .set({
            newResponses: sql`GREATEST(COALESCE(${gig.newResponses}, 0) - 1, 0)`,
          })
          .where(eq(gig.id, response.entityId));
      } else if (!wasNew && isNew) {
        // Отклик стал новым - увеличиваем счетчик
        await context.db
          .update(gig)
          .set({
            newResponses: sql`COALESCE(${gig.newResponses}, 0) + 1`,
          })
          .where(eq(gig.id, response.entityId));
      }
    }

    return updated;
  });
