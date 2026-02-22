import { and, count, eq, sql } from "@qbs-autonaim/db";
import { gig, response } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

/**
 * Синхронизирует счетчики откликов для всех gig в workspace
 * Используется для массового исправления рассинхронизации
 * Более эффективная версия с использованием одного запроса
 */
export const syncAllResponseCounts = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      forceSync: z.boolean().default(false), // Принудительная синхронизация всех
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

    // Получаем актуальные счетчики для всех gigs одним запросом
    const responseCounts = await context.db
      .select({
        entityId: response.entityId,
        total: count(),
        newCount: sql<number>`count(case when ${response.status} = 'NEW' then 1 end)`,
      })
      .from(response)
      .where(
        and(
          eq(response.entityType, "gig"),
          eq(
            response.entityId,
            sql`any(select id from gigs where workspace_id = ${input.workspaceId})`,
          ),
        ),
      )
      .groupBy(response.entityId);

    // Создаем карту счетчиков для быстрого доступа
    const countsMap = new Map(
      responseCounts.map((count) => [
        count.entityId,
        { total: count.total, newCount: count.newCount },
      ]),
    );

    // Получаем все gig в workspace
    const gigs = await context.db.query.gig.findMany({
      where: eq(gig.workspaceId, input.workspaceId),
      columns: {
        id: true,
        responses: true,
        newResponses: true,
      },
    });

    const results = [];

    // Синхронизируем счетчики для каждого gig
    for (const gigItem of gigs) {
      const actualCounts = countsMap.get(gigItem.id) ?? {
        total: 0,
        newCount: 0,
      };

      // Обновляем если есть расхождение или принудительная синхронизация
      if (
        input.forceSync ||
        actualCounts.total !== (gigItem.responses ?? 0) ||
        actualCounts.newCount !== (gigItem.newResponses ?? 0)
      ) {
        await context.db
          .update(gig)
          .set({
            responses: actualCounts.total,
            newResponses: actualCounts.newCount,
          })
          .where(eq(gig.id, gigItem.id));

        results.push({
          gigId: gigItem.id,
          previousTotal: gigItem.responses ?? 0,
          newTotal: actualCounts.total,
          previousNew: gigItem.newResponses ?? 0,
          newNew: actualCounts.newCount,
          updated: true,
        });
      }
    }

    return {
      totalGigs: gigs.length,
      updatedGigs: results.length,
      results,
      syncedAt: new Date().toISOString(),
    };
  });
