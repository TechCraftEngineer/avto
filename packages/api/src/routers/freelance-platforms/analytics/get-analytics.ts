import { and, count, eq, gte, lte, sql } from "@qbs-autonaim/db";
import {
  responseScreening,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { createErrorHandler } from "../../../utils/error-handler";

const getAnalyticsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const getAnalytics = protectedProcedure
  .input(getAnalyticsInputSchema)
  .query(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверка доступа к workspace
      const access = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id,
      );

      if (!access) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Построение условий фильтрации
      const conditions = [eq(vacancy.workspaceId, input.workspaceId)];

      // Фильтр по датам
      if (input.dateFrom) {
        conditions.push(gte(vacancy.createdAt, new Date(input.dateFrom)));
      }
      if (input.dateTo) {
        conditions.push(lte(vacancy.createdAt, new Date(input.dateTo)));
      }

      // Требование 15.1: Время до шортлиста
      const timeToShortlist = await ctx.db
        .select({
          vacancyId: vacancy.id,
          vacancyTitle: vacancy.title,
          source: vacancy.source,
          createdAt: vacancy.createdAt,
          firstShortlistDate: sql<Date | null>`(
          SELECT MIN(rs."created_at")
          FROM ${responseTable} vr
          INNER JOIN ${responseScreening} rs ON vr.id = rs."response_id"
          WHERE vr."entity_id" = ${vacancy.id}
          AND vr."entity_type" = 'vacancy'
          AND rs."detailed_score" >= 60
        )`,
          daysToShortlist: sql<number | null>`(
          SELECT EXTRACT(EPOCH FROM (MIN(rs."created_at") - ${vacancy.createdAt})) / 86400
          FROM ${responseTable} vr
          INNER JOIN ${responseScreening} rs ON vr.id = rs."response_id"
          WHERE vr."entity_id" = ${vacancy.id}
          AND vr."entity_type" = 'vacancy'
          AND rs."detailed_score" >= 60
        )`,
        })
        .from(vacancy)
        .where(and(...conditions));

      // Требование 15.2: Коэффициент завершения интервью
      const completionRates = await ctx.db
        .select({
          source: vacancy.source,
          totalResponses: sql<number>`COUNT(DISTINCT ${responseTable.id})`,
          completedInterviews: sql<number>`COUNT(DISTINCT CASE
          WHEN ${responseScreening.id} IS NOT NULL
          THEN ${responseTable.id}
        END)`,
          completionRate: sql<number>`ROUND(
          CAST(COUNT(DISTINCT CASE
            WHEN ${responseScreening.id} IS NOT NULL
            THEN ${responseTable.id}
          END) AS DECIMAL) /
          NULLIF(COUNT(DISTINCT ${responseTable.id}), 0) * 100,
          2
        )`,
        })
        .from(vacancy)
        .leftJoin(
          responseTable,
          and(
            eq(vacancy.id, responseTable.entityId),
            eq(responseTable.entityType, "vacancy"),
          ),
        )
        .leftJoin(
          responseScreening,
          eq(responseTable.id, responseScreening.responseId),
        )
        .where(and(...conditions))
        .groupBy(vacancy.source);

      // Требование 15.3: Распределение оценок
      const scoreDistribution = await ctx.db
        .select({
          scoreRange: sql<string>`CASE
          WHEN ${responseScreening.overallScore} >= 90 THEN '90-100'
          WHEN ${responseScreening.overallScore} >= 80 THEN '80-89'
          WHEN ${responseScreening.overallScore} >= 70 THEN '70-79'
          WHEN ${responseScreening.overallScore} >= 60 THEN '60-69'
          WHEN ${responseScreening.overallScore} >= 50 THEN '50-59'
          ELSE '0-49'
        END`,
          count: count(responseScreening.id),
          avgScore: sql<number>`ROUND(AVG(${responseScreening.overallScore}), 2)`,
        })
        .from(responseScreening)
        .innerJoin(
          responseTable,
          eq(responseScreening.responseId, responseTable.id),
        )
        .innerJoin(
          vacancy,
          and(
            eq(responseTable.entityId, vacancy.id),
            eq(responseTable.entityType, "vacancy"),
          ),
        )
        .where(and(...conditions))
        .groupBy(sql`1`)
        .orderBy(sql`1 DESC`);

      // Требование 15.4: Сравнение между фриланс-платформами
      const platformComparison = await ctx.db
        .select({
          platform: vacancy.source,
          totalVacancies: count(vacancy.id),
          totalResponses: sql<number>`COUNT(DISTINCT ${responseTable.id})`,
          completedInterviews: sql<number>`COUNT(DISTINCT CASE
          WHEN ${responseScreening.id} IS NOT NULL
          THEN ${responseTable.id}
        END)`,
          avgScore: sql<number>`ROUND(AVG(${responseScreening.overallScore}), 2)`,
          avgTimeToShortlist: sql<number | null>`ROUND(
          AVG(EXTRACT(EPOCH FROM (${responseScreening.createdAt} - ${vacancy.createdAt})) / 86400),
          2
        )`,
          completionRate: sql<number>`ROUND(
          CAST(COUNT(DISTINCT CASE
            WHEN ${responseScreening.id} IS NOT NULL
            THEN ${responseTable.id}
          END) AS DECIMAL) /
          NULLIF(COUNT(DISTINCT ${responseTable.id}), 0) * 100,
          2
        )`,
        })
        .from(vacancy)
        .leftJoin(
          responseTable,
          and(
            eq(vacancy.id, responseTable.entityId),
            eq(responseTable.entityType, "vacancy"),
          ),
        )
        .leftJoin(
          responseScreening,
          eq(responseTable.id, responseScreening.responseId),
        )
        .where(and(...conditions))
        .groupBy(vacancy.source);

      // Требование 15.5: Сравнение фриланс vs HeadHunter
      const sourceComparison = await ctx.db
        .select({
          sourceType: sql<string>`CASE
          WHEN ${vacancy.source} = 'HH' THEN 'HeadHunter'
          ELSE 'Фриланс-платформы'
        END`,
          totalVacancies: count(vacancy.id),
          totalResponses: sql<number>`COUNT(DISTINCT ${responseTable.id})`,
          completedInterviews: sql<number>`COUNT(DISTINCT CASE
          WHEN ${responseScreening.id} IS NOT NULL
          THEN ${responseTable.id}
        END)`,
          avgScore: sql<number>`ROUND(AVG(${responseScreening.overallScore}), 2)`,
          avgTimeToShortlist: sql<number | null>`ROUND(
          AVG(EXTRACT(EPOCH FROM (${responseScreening.createdAt} - ${vacancy.createdAt})) / 86400),
          2
        )`,
          completionRate: sql<number>`ROUND(
          CAST(COUNT(DISTINCT CASE
            WHEN ${responseScreening.id} IS NOT NULL
            THEN ${responseTable.id}
          END) AS DECIMAL) /
          NULLIF(COUNT(DISTINCT ${responseTable.id}), 0) * 100,
          2
        )`,
        })
        .from(vacancy)
        .leftJoin(
          responseTable,
          and(
            eq(vacancy.id, responseTable.entityId),
            eq(responseTable.entityType, "vacancy"),
          ),
        )
        .leftJoin(
          responseScreening,
          eq(responseTable.id, responseScreening.responseId),
        )
        .where(and(...conditions))
        .groupBy(sql`1`);

      // Расчет общей статистики
      const avgTimeToShortlistDays =
        timeToShortlist
          .filter((v) => v.daysToShortlist !== null)
          .reduce((sum, v) => sum + (v.daysToShortlist ?? 0), 0) /
          timeToShortlist.filter((v) => v.daysToShortlist !== null).length || 0;

      // Взвешенное среднее: учитываем количество откликов каждого источника
      const totalCompleted = completionRates.reduce(
        (sum, r) =>
          sum + Number(r.completionRate ?? 0) * Number(r.totalResponses ?? 0),
        0,
      );
      const totalResponses = completionRates.reduce(
        (sum, r) => sum + Number(r.totalResponses ?? 0),
        0,
      );
      const overallCompletionRate =
        totalResponses > 0 ? totalCompleted / totalResponses : 0;

      return {
        // Общая статистика
        summary: {
          avgTimeToShortlistDays: Math.round(avgTimeToShortlistDays * 10) / 10,
          overallCompletionRate: Math.round(overallCompletionRate * 10) / 10,
          totalVacancies: timeToShortlist.length,
          totalWithShortlist: timeToShortlist.filter(
            (v) => v.firstShortlistDate !== null,
          ).length,
        },
        // Детальные данные
        timeToShortlist: timeToShortlist.map((v) => ({
          vacancyId: v.vacancyId,
          vacancyTitle: v.vacancyTitle,
          source: v.source,
          createdAt: v.createdAt,
          firstShortlistDate: v.firstShortlistDate,
          daysToShortlist: v.daysToShortlist
            ? Math.round(v.daysToShortlist * 10) / 10
            : null,
        })),
        completionRates: completionRates.map((r) => ({
          source: r.source,
          totalResponses: Number(r.totalResponses),
          completedInterviews: Number(r.completedInterviews),
          completionRate: Number(r.completionRate ?? 0),
        })),
        scoreDistribution: scoreDistribution.map((s) => ({
          scoreRange: s.scoreRange,
          count: s.count,
          avgScore: Number(s.avgScore ?? 0),
        })),
        platformComparison: platformComparison.map((p) => ({
          platform: p.platform,
          totalVacancies: p.totalVacancies,
          totalResponses: Number(p.totalResponses),
          completedInterviews: Number(p.completedInterviews),
          avgScore: Number(p.avgScore ?? 0),
          avgTimeToShortlist: p.avgTimeToShortlist
            ? Math.round(Number(p.avgTimeToShortlist) * 10) / 10
            : null,
          completionRate: Number(p.completionRate ?? 0),
        })),
        sourceComparison: sourceComparison.map((s) => ({
          sourceType: s.sourceType,
          totalVacancies: s.totalVacancies,
          totalResponses: Number(s.totalResponses),
          completedInterviews: Number(s.completedInterviews),
          avgScore: Number(s.avgScore ?? 0),
          avgTimeToShortlist: s.avgTimeToShortlist
            ? Math.round(Number(s.avgTimeToShortlist) * 10) / 10
            : null,
          completionRate: Number(s.completionRate ?? 0),
        })),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        workspaceId: input.workspaceId,
        operation: "get_analytics",
      });
    }
  });
