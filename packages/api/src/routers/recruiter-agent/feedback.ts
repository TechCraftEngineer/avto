/**
 * Feedback procedure для AI-ассистента рекрутера
 *
 * Обратная связь от рекрутера:
 * - Принятие/отклонение рекомендаций
 * - Указание на ошибки
 * - Метрики качества
 *
 * Requirements: 10.1, 10.2, 10.4
 */

import {
  agentFeedback,
  and,
  count,
  desc,
  eq,
  gte,
  lte,
  sql,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { checkWorkspaceAccess } from "./middleware";

/**
 * Схема для отправки feedback
 */
const submitFeedbackInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  actionId: z.uuid().optional(),
  recommendationId: z.uuid().optional(),
  feedbackType: z.enum(["accepted", "rejected", "modified", "error_report"]),
  originalRecommendation: z.string().optional(),
  userAction: z.string().optional(),
  reason: z.string().max(1000).optional(),
  rating: z.number().min(1).max(5).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Схема для получения feedback
 */
const getFeedbackInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  feedbackType: z
    .enum(["accepted", "rejected", "modified", "error_report"])
    .optional(),
});

/**
 * Схема для получения метрик
 */
const getMetricsInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * Схема для получения feedback history пользователя
 */
const getUserFeedbackHistoryInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  limit: z.number().min(1).max(100).default(50),
});

/**
 * Submit Feedback procedure
 * Сохраняет feedback в базу данных
 *
 * Requirements: 10.1
 */
export const submitFeedback = protectedProcedure
  .input(submitFeedbackInputSchema)
  .handler(async ({ input, context }) => {
    const {
      workspaceId,
      actionId,
      recommendationId,
      feedbackType,
      originalRecommendation,
      userAction,
      reason,
      rating,
      metadata,
    } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    // Сохраняем feedback в БД
    const [feedbackEntry] = await context.db
      .insert(agentFeedback)
      .values({
        workspaceId,
        userId: context.session.user.id,
        actionId,
        recommendationId,
        feedbackType,
        originalRecommendation,
        userAction,
        reason,
        rating,
        metadata,
      })
      .returning();

    if (!feedbackEntry) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Не удалось сохранить feedback", });
    }

    // Логируем в audit log
    await context.auditLogger.logAccess({
      userId: context.session.user.id,
      workspaceId,
      action: "CREATE",
      resourceType: "VACANCY_RESPONSE",
      resourceId: feedbackEntry.id,
      metadata: {
        type: "recruiter_agent_feedback",
        feedbackType,
        actionId,
        recommendationId,
        rating,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return {
      success: true,
      feedbackId: feedbackEntry.id,
      message: "Спасибо за обратную связь!",
    };
  });

/**
 * Get Feedback procedure
 * Получает список feedback из базы данных
 */
export const getFeedback = protectedProcedure
  .input(getFeedbackInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId, limit, offset, feedbackType } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    // Строим условия фильтрации
    const conditions = [eq(agentFeedback.workspaceId, workspaceId)];

    if (feedbackType) {
      conditions.push(eq(agentFeedback.feedbackType, feedbackType));
    }

    // Получаем feedback из БД
    const feedbackList = await context.db
      .select()
      .from(agentFeedback)
      .where(and(...conditions))
      .orderBy(desc(agentFeedback.createdAt))
      .limit(limit)
      .offset(offset);

    // Получаем общее количество
    const [totalResult] = await context.db
      .select({ count: count() })
      .from(agentFeedback)
      .where(and(...conditions));

    return {
      feedback: feedbackList.map((f) => ({
        id: f.id,
        userId: f.userId,
        actionId: f.actionId,
        recommendationId: f.recommendationId,
        feedbackType: f.feedbackType,
        originalRecommendation: f.originalRecommendation,
        userAction: f.userAction,
        reason: f.reason,
        rating: f.rating,
        createdAt: f.createdAt,
      })),
      total: totalResult?.count ?? 0,
      limit,
      offset,
    };
  });

/**
 * Get Quality Metrics procedure
 * Рассчитывает метрики качества рекомендаций
 *
 * Requirements: 10.4
 */
export const getMetrics = protectedProcedure
  .input(getMetricsInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId, startDate, endDate } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    // Строим условия фильтрации
    const conditions = [eq(agentFeedback.workspaceId, workspaceId)];

    if (startDate) {
      conditions.push(gte(agentFeedback.createdAt, startDate));
    }

    if (endDate) {
      conditions.push(lte(agentFeedback.createdAt, endDate));
    }

    // Получаем агрегированные метрики
    const metricsResult = await context.db
      .select({
        feedbackType: agentFeedback.feedbackType,
        count: count(),
        avgRating: sql<number>`AVG(${agentFeedback.rating})::float`,
      })
      .from(agentFeedback)
      .where(and(...conditions))
      .groupBy(agentFeedback.feedbackType);

    // Преобразуем результаты в удобный формат
    const metrics = {
      total: 0,
      accepted: 0,
      rejected: 0,
      modified: 0,
      errorReports: 0,
      acceptanceRate: 0,
      rejectionRate: 0,
      avgRating: null as number | null,
    };

    let totalRatingSum = 0;
    let totalRatingCount = 0;

    for (const row of metricsResult) {
      const rowCount = Number(row.count);
      metrics.total += rowCount;

      switch (row.feedbackType) {
        case "accepted":
          metrics.accepted = rowCount;
          break;
        case "rejected":
          metrics.rejected = rowCount;
          break;
        case "modified":
          metrics.modified = rowCount;
          break;
        case "error_report":
          metrics.errorReports = rowCount;
          break;
      }

      if (row.avgRating !== null) {
        totalRatingSum += row.avgRating * rowCount;
        totalRatingCount += rowCount;
      }
    }

    // Рассчитываем rates
    if (metrics.total > 0) {
      metrics.acceptanceRate =
        Math.round(
          ((metrics.accepted + metrics.modified) / metrics.total) * 10000,
        ) / 100;
      metrics.rejectionRate =
        Math.round((metrics.rejected / metrics.total) * 10000) / 100;
    }

    // Рассчитываем средний рейтинг
    if (totalRatingCount > 0) {
      metrics.avgRating =
        Math.round((totalRatingSum / totalRatingCount) * 100) / 100;
    }

    return {
      metrics,
      period: {
        startDate: startDate ?? null,
        endDate: endDate ?? null,
      },
    };
  });

/**
 * Get User Feedback History procedure
 * Получает историю feedback конкретного пользователя для влияния на рекомендации
 *
 * Requirements: 10.2
 */
export const getUserFeedbackHistory = protectedProcedure
  .input(getUserFeedbackHistoryInputSchema)
  .handler(async ({ input, context }) => {
    const { workspaceId, limit } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    // Получаем feedback пользователя
    const feedbackList = await context.db
      .select()
      .from(agentFeedback)
      .where(
        and(
          eq(agentFeedback.workspaceId, workspaceId),
          eq(agentFeedback.userId, context.session.user.id),
        ),
      )
      .orderBy(desc(agentFeedback.createdAt))
      .limit(limit);

    // Рассчитываем статистику пользователя
    const [statsResult] = await context.db
      .select({
        total: count(),
        accepted: sql<number>`COUNT(*) FILTER (WHERE ${agentFeedback.feedbackType} = 'accepted')`,
        rejected: sql<number>`COUNT(*) FILTER (WHERE ${agentFeedback.feedbackType} = 'rejected')`,
        modified: sql<number>`COUNT(*) FILTER (WHERE ${agentFeedback.feedbackType} = 'modified')`,
      })
      .from(agentFeedback)
      .where(
        and(
          eq(agentFeedback.workspaceId, workspaceId),
          eq(agentFeedback.userId, context.session.user.id),
        ),
      );

    const total = Number(statsResult?.total ?? 0);
    const accepted = Number(statsResult?.accepted ?? 0);
    const rejected = Number(statsResult?.rejected ?? 0);
    const modified = Number(statsResult?.modified ?? 0);

    return {
      feedback: feedbackList.map((f) => ({
        id: f.id,
        feedbackType: f.feedbackType,
        originalRecommendation: f.originalRecommendation,
        userAction: f.userAction,
        reason: f.reason,
        createdAt: f.createdAt,
      })),
      stats: {
        total,
        accepted,
        rejected,
        modified,
        acceptanceRate:
          total > 0
            ? Math.round(((accepted + modified) / total) * 10000) / 100
            : 0,
        rejectionRate:
          total > 0 ? Math.round((rejected / total) * 10000) / 100 : 0,
      },
    };
  });

/**
 * Объединённый экспорт для feedback
 */
export const feedback = {
  submit: submitFeedback,
  list: getFeedback,
  metrics: getMetrics,
  userHistory: getUserFeedbackHistory,
};

/**
 * Функция для получения feedback history пользователя (для использования в агентах)
 * Используется в context.ts для влияния на рекомендации
 */
export async function loadUserFeedbackHistory(
  db: typeof import("@qbs-autonaim/db/client").db,
  workspaceId: string,
  userId: string,
  limit = 50,
): Promise<
  Array<{
    id: string;
    feedbackType: "accepted" | "rejected" | "modified" | "error_report";
    originalRecommendation: string | null;
    userAction: string | null;
    reason: string | null;
    createdAt: Date;
  }>
> {
  const feedbackList = await db
    .select({
      id: agentFeedback.id,
      feedbackType: agentFeedback.feedbackType,
      originalRecommendation: agentFeedback.originalRecommendation,
      userAction: agentFeedback.userAction,
      reason: agentFeedback.reason,
      createdAt: agentFeedback.createdAt,
    })
    .from(agentFeedback)
    .where(
      and(
        eq(agentFeedback.workspaceId, workspaceId),
        eq(agentFeedback.userId, userId),
      ),
    )
    .orderBy(desc(agentFeedback.createdAt))
    .limit(limit);

  return feedbackList;
}

/**
 * Функция для расчёта метрик пользователя (для использования в агентах)
 */
export async function calculateUserFeedbackStats(
  db: typeof import("@qbs-autonaim/db/client").db,
  workspaceId: string,
  userId: string,
): Promise<{
  total: number;
  accepted: number;
  rejected: number;
  modified: number;
  acceptanceRate: number;
  rejectionRate: number;
}> {
  const [statsResult] = await db
    .select({
      total: count(),
      accepted: sql<number>`COUNT(*) FILTER (WHERE ${agentFeedback.feedbackType} = 'accepted')`,
      rejected: sql<number>`COUNT(*) FILTER (WHERE ${agentFeedback.feedbackType} = 'rejected')`,
      modified: sql<number>`COUNT(*) FILTER (WHERE ${agentFeedback.feedbackType} = 'modified')`,
    })
    .from(agentFeedback)
    .where(
      and(
        eq(agentFeedback.workspaceId, workspaceId),
        eq(agentFeedback.userId, userId),
      ),
    );

  const total = Number(statsResult?.total ?? 0);
  const accepted = Number(statsResult?.accepted ?? 0);
  const rejected = Number(statsResult?.rejected ?? 0);
  const modified = Number(statsResult?.modified ?? 0);

  return {
    total,
    accepted,
    rejected,
    modified,
    acceptanceRate:
      total > 0 ? Math.round(((accepted + modified) / total) * 10000) / 100 : 0,
    rejectionRate: total > 0 ? Math.round((rejected / total) * 10000) / 100 : 0,
  };
}
