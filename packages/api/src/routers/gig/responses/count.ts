import { ORPCError } from "@orpc/server";
import { and, count, eq } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const countResponses = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
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

    // Получаем gig принадлежащий workspace
    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("NOT_FOUND", { message: "Проект не найден" });
    }

    // Подсчитываем общее количество откликов
    const totalResult = await context.db
      .select({ count: count() })
      .from(responseTable)
      .where(
        and(
          eq(responseTable.entityType, "gig"),
          eq(responseTable.entityId, input.gigId),
        ),
      );

    const total = totalResult[0]?.count ?? 0;

    // Подсчитываем новые отклики (статус NEW)
    const newResult = await context.db
      .select({ count: count() })
      .from(responseTable)
      .where(
        and(
          eq(responseTable.entityType, "gig"),
          eq(responseTable.entityId, input.gigId),
          eq(responseTable.status, "NEW"),
        ),
      );

    const newCount = newResult[0]?.count ?? 0;

    return {
      total,
      new: newCount,
      // Сохраненные ранее значения из таблицы gig для сравнения
      gigResponses: existingGig.responses ?? 0,
      gigNewResponses: existingGig.newResponses ?? 0,
      // Флаг синхронизации
      isSynced:
        total === (existingGig.responses ?? 0) &&
        newCount === (existingGig.newResponses ?? 0),
    };
  });
