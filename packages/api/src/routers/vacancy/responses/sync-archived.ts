import { and, eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  cancelSync,
  getSyncStatus,
  type ResponseProcessingResult,
  retryResponse,
  type SyncResult,
  syncArchivedResponses,
} from "../../../services/sync-archived-responses";
import { protectedProcedure } from "../../../trpc";

/**
 * Схема входных данных для синхронизации архивных откликов
 */
const syncArchivedInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().uuid("Некорректный ID вакансии"),
  options: z
    .object({
      batchSize: z.number().int().min(1).max(100).default(10).optional(),
      retryFailed: z.boolean().default(true).optional(),
      maxRetries: z.number().int().min(1).max(10).default(3).optional(),
      analyzeResponses: z.boolean().default(true).optional(),
    })
    .optional(),
});

/**
 * Схема входных данных для получения статуса синхронизации
 */
const getStatusInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().uuid("Некорректный ID вакансии"),
});

/**
 * Схема входных данных для повтора обработки отклика
 */
const retryResponseInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  responseId: z.string().uuid("Некорректный ID отклика"),
  maxRetries: z.number().int().min(1).max(10).default(3).optional(),
});

/**
 * Схема входных данных для отмены синхронизации
 */
const cancelSyncInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().uuid("Некорректный ID вакансии"),
});

/**
 * Основная функция синхронизации архивных откликов
 * Объединяет полный цикл обработки архивных откликов на вакансии в едином методе
 */
export const syncArchived = protectedProcedure
  .input(syncArchivedInputSchema)
  .mutation(async ({ ctx, input }): Promise<SyncResult> => {
    const { workspaceId, vacancyId, options } = input;

    // Проверяем доступ к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Получаем вакансию и проверяем её существование
    const vacancyData = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, vacancyId),
        eq(vacancy.workspaceId, workspaceId),
      ),
    });

    if (!vacancyData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Получаем публикацию на HH.ru для этой вакансии
    const publication = await ctx.db.query.vacancyPublication.findFirst({
      where: (pub, { and, eq }) =>
        and(eq(pub.vacancyId, vacancyId), eq(pub.platform, "HH")),
    });

    if (!publication) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Вакансия не опубликована на HH.ru (HeadHunter)",
      });
    }

    if (!publication.externalId && !publication.url) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "У публикации нет внешнего идентификатора или ссылки для синхронизации",
      });
    }

    // Выполняем синхронизацию
    const result = await syncArchivedResponses({
      vacancyId,
      workspaceId,
      ...options,
    });

    return result;
  });

/**
 * Получить текущий статус синхронизации
 */
export const getSyncStatusEndpoint = protectedProcedure
  .input(getStatusInputSchema)
  .query(
    async ({
      ctx,
      input,
    }): Promise<{
      isRunning: boolean;
      lastSyncAt: Date | null;
      lastResult: SyncResult | null;
    } | null> => {
      const { workspaceId, vacancyId } = input;

      // Проверяем доступ к workspace
      const hasAccess = await ctx.workspaceRepository.checkAccess(
        workspaceId,
        ctx.session.user.id,
      );

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к workspace",
        });
      }

      // Проверяем существование вакансии
      const vacancyData = await ctx.db.query.vacancy.findFirst({
        where: and(
          eq(vacancy.id, vacancyId),
          eq(vacancy.workspaceId, workspaceId),
        ),
      });

      if (!vacancyData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Вакансия не найдена",
        });
      }

      return await getSyncStatus(vacancyId);
    },
  );

/**
 * Отменить текущую синхронизацию
 */
export const cancelSyncEndpoint = protectedProcedure
  .input(cancelSyncInputSchema)
  .mutation(async ({ ctx, input }): Promise<{ success: boolean }> => {
    const { workspaceId, vacancyId } = input;

    // Проверяем доступ к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Проверяем существование вакансии
    const vacancyData = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, vacancyId),
        eq(vacancy.workspaceId, workspaceId),
      ),
    });

    if (!vacancyData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    const success = await cancelSync(vacancyId);
    return { success };
  });

/**
 * Повторить обработку отдельного отклика
 */
export const retryResponseEndpoint = protectedProcedure
  .input(retryResponseInputSchema)
  .mutation(async ({ ctx, input }): Promise<ResponseProcessingResult> => {
    const { workspaceId, responseId, maxRetries } = input;

    // Проверяем доступ к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Проверяем существование отклика
    const response = await ctx.db.query.response.findFirst({
      where: (r, { eq }) => eq(r.id, responseId),
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    // Проверяем доступ к вакансии отклика
    const vacancyData = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, response.entityId),
        eq(vacancy.workspaceId, workspaceId),
      ),
    });

    if (!vacancyData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия для отклика не найдена",
      });
    }

    return await retryResponse(responseId, { maxRetries });
  });
