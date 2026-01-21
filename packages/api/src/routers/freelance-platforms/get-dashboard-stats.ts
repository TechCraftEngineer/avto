import { and, count, eq, gte, lte, sql } from "@qbs-autonaim/db";
import {
  interviewLink,
  responseScreening,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";

const getDashboardStatsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  status: z.enum(["active", "inactive", "all"]).optional().default("all"),
  platformSource: z
    .enum(["HH", "AVITO", "SUPERJOB", "HABR", "KWORK", "FL_RU", "FREELANCE_RU", "WEB_LINK"])
    .optional(),
});

export const getDashboardStats = protectedProcedure
  .input(getDashboardStatsInputSchema)
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

      // Фильтр по статусу
      if (input.status === "active") {
        conditions.push(eq(vacancy.isActive, true));
      } else if (input.status === "inactive") {
        conditions.push(eq(vacancy.isActive, false));
      }

      // Фильтр по платформе
      if (input.platformSource) {
        conditions.push(eq(vacancy.source, input.platformSource));
      }

      // Фильтр по датам
      if (input.dateFrom) {
        conditions.push(gte(vacancy.createdAt, new Date(input.dateFrom)));
      }
      if (input.dateTo) {
        conditions.push(lte(vacancy.createdAt, new Date(input.dateTo)));
      }

      // Получаем обзорные метрики
      const overviewMetrics = await ctx.db
        .select({
          totalJobs: count(vacancy.id),
          totalResponses: sql<number>`COALESCE(SUM(${vacancy.responses}), 0)`,
          totalNewResponses: sql<number>`COALESCE(SUM(${vacancy.newResponses}), 0)`,
          totalSuitableResumes: sql<number>`COALESCE(SUM(${vacancy.suitableResumes}), 0)`,
        })
        .from(vacancy)
        .where(and(...conditions));

      // Получаем список заданий с ключевой статистикой
      const jobs = await ctx.db
        .select({
          id: vacancy.id,
          title: vacancy.title,
          source: vacancy.source,
          isActive: vacancy.isActive,
          createdAt: vacancy.createdAt,
          url: vacancy.url,
          // Статистика откликов
          totalResponses: vacancy.responses,
          newResponses: vacancy.newResponses,
          suitableResumes: vacancy.suitableResumes,
          // Статистика по источникам
          hhApiCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${responseTable} 
          WHERE ${responseTable.entityId} = ${vacancy.id} 
          AND ${responseTable.entityType} = 'vacancy'
          AND ${responseTable.importSource} = 'HH'
        )`,
          freelanceManualCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${responseTable} 
          WHERE ${responseTable.entityId} = ${vacancy.id} 
          AND ${responseTable.entityType} = 'vacancy'
          AND ${responseTable.importSource} = 'MANUAL'
        )`,
          freelanceLinkCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${responseTable} 
          WHERE ${responseTable.entityId} = ${vacancy.id} 
          AND ${responseTable.entityType} = 'vacancy'
          AND ${responseTable.importSource} = 'WEB_LINK'
        )`,
          // Статистика интервью
          completedInterviews: sql<number>`(
          SELECT COUNT(*) 
          FROM ${responseTable} vr
          INNER JOIN ${responseScreening} rs ON vr.id = rs."response_id"
          WHERE vr."entity_id" = ${vacancy.id}
          AND vr."entity_type" = 'vacancy'
        )`,
          // Средняя оценка
          avgScore: sql<number>`(
          SELECT COALESCE(AVG(rs."detailed_score"), 0)
          FROM ${responseTable} vr
          INNER JOIN ${responseScreening} rs ON vr.id = rs."response_id"
          WHERE vr."entity_id" = ${vacancy.id}
          AND vr."entity_type" = 'vacancy'
        )`,
          // Есть ли ссылка на интервью
          hasInterviewLink: sql<boolean>`EXISTS(
          SELECT 1 
          FROM ${interviewLink} 
          WHERE ${interviewLink.entityId} = ${vacancy.id}
          AND ${interviewLink.entityType} = 'vacancy'
        )`,
        })
        .from(vacancy)
        .where(and(...conditions))
        .orderBy(vacancy.createdAt);

      // Рассчитываем средний коэффициент завершения
      const totalResponsesSum = jobs.reduce(
        (sum, job) => sum + (job.totalResponses ?? 0),
        0,
      );
      const completedInterviewsSum = jobs.reduce(
        (sum, job) => sum + (job.completedInterviews ?? 0),
        0,
      );
      const avgCompletionRate =
        totalResponsesSum > 0
          ? Math.round((completedInterviewsSum / totalResponsesSum) * 100)
          : 0;

      return {
        overview: {
          totalJobs: overviewMetrics[0]?.totalJobs ?? 0,
          totalResponses: Number(overviewMetrics[0]?.totalResponses ?? 0),
          totalNewResponses: Number(overviewMetrics[0]?.totalNewResponses ?? 0),
          totalSuitableResumes: Number(
            overviewMetrics[0]?.totalSuitableResumes ?? 0,
          ),
          avgCompletionRate,
        },
        jobs: jobs.map((job) => ({
          ...job,
          needsAttention:
            (job.newResponses ?? 0) > 5 || (job.totalResponses ?? 0) > 20,
        })),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        workspaceId: input.workspaceId,
        operation: "get_dashboard_stats",
      });
    }
  });
