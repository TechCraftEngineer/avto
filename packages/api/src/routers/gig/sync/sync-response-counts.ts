import { and, count, eq, sql } from "@qbs-autonaim/db";
import { gig, response } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

/**
 * Синхронизирует счетчики откликов в таблице gig с реальными данными
 * Используется для исправления рассинхронизации
 */
export const syncResponseCounts = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
      forceSync: z.boolean().default(false), // Принудительная синхронизация
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

    // Проверяем что gig принадлежит workspace
    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("NOT_FOUND", { message: "Задание не найдено", });
    }

    // Получаем актуальные счетчики одним запросом
    const countsResult = await context.db
      .select({
        total: count(),
        newCount: sql<number>`count(case when ${response.status} = 'NEW' then 1 end)`,
      })
      .from(response)
      .where(
        and(eq(response.entityType, "gig"), eq(response.entityId, input.gigId)),
      );

    const actualCounts = countsResult[0] ?? { total: 0, newCount: 0 };

    // Обновляем счетчики если есть расхождение или принудительная синхронизация
    const needsUpdate =
      input.forceSync ||
      actualCounts.total !== (existingGig.responses ?? 0) ||
      actualCounts.newCount !== (existingGig.newResponses ?? 0);

    if (needsUpdate) {
      await context.db
        .update(gig)
        .set({
          responses: actualCounts.total,
          newResponses: actualCounts.newCount,
        })
        .where(eq(gig.id, input.gigId));
    }

    return {
      total: actualCounts.total,
      new: actualCounts.newCount,
      previousTotal: existingGig.responses ?? 0,
      previousNew: existingGig.newResponses ?? 0,
      updated: needsUpdate,
      syncedAt: new Date().toISOString(),
    };
  });
