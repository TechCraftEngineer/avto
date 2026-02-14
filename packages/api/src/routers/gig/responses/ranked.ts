import { getAIModel } from "@qbs-autonaim/lib/ai";
import { RankingService } from "@qbs-autonaim/shared/server";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

/**
 * Получение ранжированного списка кандидатов
 *
 * Requirements: 5.1-5.7
 */
export const ranked = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
      minScore: z.number().int().min(0).max(100).optional(),
      recommendation: z
        .enum([
          "HIGHLY_RECOMMENDED",
          "RECOMMENDED",
          "NEUTRAL",
          "NOT_RECOMMENDED",
        ])
        .optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }),
  )
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
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

    // Создаем RankingService с AI конфигурацией
    const model = getAIModel();
    const rankingService = new RankingService({
      model,
      maxSteps: 5,
    });

    // Получаем ранжированных кандидатов из БД
    const result = await rankingService.getRankedCandidates(
      input.gigId,
      input.workspaceId,
      {
        minScore: input.minScore,
        recommendation: input.recommendation,
        limit: input.limit,
        offset: input.offset,
      },
    );

    return result;
  });
