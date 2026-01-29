import { inngest } from "@qbs-autonaim/jobs/client";
import { GigShortlistGenerator } from "@qbs-autonaim/shared";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { createErrorHandler } from "../../../utils/error-handler";

/**
 * Получение шортлиста кандидатов для gig задания
 *
 * Выбирает топ-кандидатов на основе AI-ранжирования
 */
export const getGigShortlist = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
      minScore: z.number().int().min(0).max(100).optional().default(70),
      maxCandidates: z.number().int().min(1).max(20).optional().default(8),
      includeOnlyHighlyRecommended: z.boolean().optional().default(false),
      prioritizeBudgetFit: z.boolean().optional().default(false),
    }),
  )
  .query(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверяем доступ к workspace
      const hasAccess = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id,
      );

      if (!hasAccess) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Проверяем существование gig и принадлежность к workspace
      const gig = await ctx.db.query.gig.findFirst({
        where: (gig, { eq, and }) =>
          and(eq(gig.id, input.gigId), eq(gig.workspaceId, input.workspaceId)),
      });

      if (!gig) {
        throw await errorHandler.handleNotFoundError("Gig задание", {
          gigId: input.gigId,
          workspaceId: input.workspaceId,
        });
      }

      // Генерируем шортлист
      const generator = new GigShortlistGenerator();
      const shortlist = await generator.generateShortlist(input.gigId, {
        minScore: input.minScore,
        maxCandidates: input.maxCandidates,
        includeOnlyHighlyRecommended: input.includeOnlyHighlyRecommended,
        prioritizeBudgetFit: input.prioritizeBudgetFit,
      });

      // Логируем доступ к персональным данным кандидатов
      for (const candidate of shortlist.candidates) {
        await ctx.auditLogger.logResponseView({
          userId: ctx.session.user.id,
          responseId: candidate.responseId,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        });
      }

      return shortlist;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        gigId: input.gigId,
        operation: "get_gig_shortlist",
      });
    }
  });

/**
 * Триггер пересчета шортлиста для gig задания
 *
 * Отправляет событие в Inngest для фоновой обработки
 */
export const recalculateGigShortlist = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверяем доступ к workspace
      const hasAccess = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id,
      );

      if (!hasAccess) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Проверяем существование gig
      const gig = await ctx.db.query.gig.findFirst({
        where: (gig, { eq, and }) =>
          and(eq(gig.id, input.gigId), eq(gig.workspaceId, input.workspaceId)),
      });

      if (!gig) {
        throw await errorHandler.handleNotFoundError("Gig задание", {
          gigId: input.gigId,
          workspaceId: input.workspaceId,
        });
      }

      // Отправляем событие в Inngest для фоновой обработки
      await inngest.send({
        name: "gig/shortlist.recalculate",
        data: {
          gigId: input.gigId,
          workspaceId: input.workspaceId,
          triggeredBy: ctx.session.user.id,
        },
      });

      return {
        success: true,
        message: "Пересчет шортлиста запущен",
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        gigId: input.gigId,
        operation: "recalculate_gig_shortlist",
      });
    }
  });
