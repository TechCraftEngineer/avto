import { and, count, eq } from "@qbs-autonaim/db";
import { gig, response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const countResponses = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверяем что gig принадлежит workspace
    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    // Подсчитываем реальное количество откликов
    const totalResult = await ctx.db
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
    const newResult = await ctx.db
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
      // Возвращаем также значения из таблицы gig для сравнения
      gigResponses: existingGig.responses ?? 0,
      gigNewResponses: existingGig.newResponses ?? 0,
      // Флаг рассинхронизации
      isSynced:
        total === (existingGig.responses ?? 0) &&
        newCount === (existingGig.newResponses ?? 0),
    };
  });
