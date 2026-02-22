import { and, eq, gte, lte, sql } from "@qbs-autonaim/db";
import {
  responseScreening,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const exportAnalyticsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const exportAnalytics = protectedProcedure
  .input(exportAnalyticsInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверка доступа к workspace
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

    // Построение условий фильтрации
    const conditions = [eq(vacancy.workspaceId, input.workspaceId)];

    if (input.dateFrom) {
      conditions.push(gte(vacancy.createdAt, new Date(input.dateFrom)));
    }
    if (input.dateTo) {
      conditions.push(lte(vacancy.createdAt, new Date(input.dateTo)));
    }

    // Получаем детальные данные для экспорта
    const analyticsData = await ctx.db
      .select({
        vacancyId: vacancy.id,
        vacancyTitle: vacancy.title,
        platform: vacancy.source,
        vacancyCreatedAt: vacancy.createdAt,
        totalResponses: sql<number>`COUNT(DISTINCT ${responseTable.id})`,
        completedInterviews: sql<number>`COUNT(DISTINCT CASE
          WHEN ${responseScreening.id} IS NOT NULL
          THEN ${responseTable.id}
        END)`,
        avgScore: sql<number>`ROUND(AVG(${responseScreening.overallScore}), 2)`,
        minScore: sql<number | null>`MIN(${responseScreening.overallScore})`,
        maxScore: sql<number | null>`MAX(${responseScreening.overallScore})`,
        completionRate: sql<number>`ROUND(
          CAST(COUNT(DISTINCT CASE
            WHEN ${responseScreening.id} IS NOT NULL
            THEN ${responseTable.id}
          END) AS DECIMAL) /
          NULLIF(COUNT(DISTINCT ${responseTable.id}), 0) * 100,
          2
        )`,
        daysToFirstShortlist: sql<number | null>`ROUND(
          EXTRACT(EPOCH FROM (MIN(${responseScreening.createdAt}) - ${vacancy.createdAt})) / 86400,
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
      .groupBy(vacancy.id, vacancy.title, vacancy.source, vacancy.createdAt)
      .orderBy(vacancy.createdAt);

    // Логируем экспорт данных для каждой вакансии
    for (const row of analyticsData) {
      await ctx.auditLogger.logDataExport({
        userId: ctx.session.user.id,
        resourceType: "VACANCY",
        resourceId: row.vacancyId,
        exportFormat: "csv",
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
    }

    // Формируем CSV
    const headers = [
      "ID вакансии",
      "Название",
      "Платформа",
      "Дата создания",
      "Всего откликов",
      "Завершено интервью",
      "Средняя оценка",
      "Мин. оценка",
      "Макс. оценка",
      "Коэффициент завершения (%)",
      "Дней до шортлиста",
    ];

    const rows = analyticsData.map((row) => [
      row.vacancyId,
      `"${row.vacancyTitle.replace(/"/g, '""')}"`, // Экранирование кавычек
      row.platform,
      new Date(row.vacancyCreatedAt).toLocaleDateString("ru-RU"),
      row.totalResponses,
      row.completedInterviews,
      row.avgScore ?? "N/A",
      row.minScore ?? "N/A",
      row.maxScore ?? "N/A",
      row.completionRate ?? 0,
      row.daysToFirstShortlist ?? "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    return {
      csv: csvContent,
      filename: `analytics-${new Date().toISOString().split("T")[0]}.csv`,
    };
  });
