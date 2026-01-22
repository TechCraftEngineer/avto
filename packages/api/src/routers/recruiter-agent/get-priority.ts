/**
 * Get Priority procedure для получения приоритизированного списка кандидатов
 */

import {
  PriorityAgent,
  type PriorityAgentInput,
  mapDBSettingsToRecruiterSettings,
} from "@qbs-autonaim/ai";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { checkRateLimit, checkWorkspaceAccess } from "./middleware";

/**
 * Get Priority procedure
 */
export const getPriority = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string(),
      limit: z.number().min(1).max(50).default(10).optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const { workspaceId, vacancyId, limit = 10 } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      ctx.workspaceRepository,
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Проверка rate limiting
    const rateLimitKey = `priority:${workspaceId}`;
    const canProceed = await checkRateLimit(rateLimitKey, 20, 60);

    if (!canProceed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Превышен лимит запросов. Попробуйте через минуту.",
      });
    }

    // Получаем отклики по вакансии
    const responses = await ctx.db.query.response.findMany({
      where: (r, { eq, and }) =>
        and(eq(r.entityType, "vacancy"), eq(r.entityId, vacancyId)),
      limit: limit * 2, // Берём больше для фильтрации
      orderBy: (r, { desc }) => [desc(r.createdAt)],
      columns: {
        id: true,
        candidateName: true,
        respondedAt: true,
        status: true,
        hrSelectionStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (responses.length === 0) {
      return {
        prioritized: [],
        message: "Нет откликов по этой вакансии для приоритизации.",
      };
    }

    // Получаем скрининги для откликов
    const responseIds = responses.map((r) => r.id);
    const screenings = await ctx.db.query.responseScreening.findMany({
      where: (s, { inArray }) => inArray(s.responseId, responseIds),
      columns: {
        responseId: true,
        score: true,
        detailedScore: true,
      },
    });

    const screeningMap = new Map(screenings.map((s) => [s.responseId, s]));

    // Формируем данные для PriorityAgent
    const responsesForAgent: PriorityAgentInput["responses"] = responses
      .map((r) => {
        const screening = screeningMap.get(r.id);

        // Вычисляем fitScore (используем score из скрининга или 0)
        const fitScore = screening?.score ?? 0;

        return {
          id: r.id,
          fitScore,
          respondedAt: r.respondedAt ?? r.createdAt,
          riskFactors: [], // Будет заполнено агентом на основе данных
          screening: screening
            ? {
                score: screening.score ?? undefined,
                detailedScore: screening.detailedScore ?? undefined,
              }
            : undefined,
          status: r.status,
          hrSelectionStatus: r.hrSelectionStatus ?? undefined,
        };
      })
      .slice(0, limit);

    // Загружаем настройки компании
    const botSettings = await ctx.db.query.botSettings.findFirst({
      where: (cs, { eq }) => eq(cs.workspaceId, workspaceId),
    });

    const recruiterSettings = mapDBSettingsToRecruiterSettings(
      botSettings
        ? {
            id: botSettings.id,
            workspaceId: botSettings.workspaceId,
            name: botSettings.companyName,
            website: botSettings.companyWebsite,
            description: botSettings.companyDescription,
            botName: botSettings.botName,
            botRole: botSettings.botRole,
          }
        : null,
    );

    // Создаём PriorityAgent
    const model = getAIModel();
    const priorityAgent = new PriorityAgent({
      model,
      maxSteps: 5,
    });

    // Выполняем приоритизацию
    const result = await priorityAgent.execute(
      {
        responses: responsesForAgent,
        vacancyId,
      },
      {
        workspaceId,
        userId: ctx.session.user.id,
        currentVacancyId: vacancyId,
        recruiterConversationHistory: [],
        recruiterCompanySettings: recruiterSettings,
        recentDecisions: [],
        conversationHistory: [],
      },
    );

    if (!result.success || !result.data) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: result.error || "Не удалось определить приоритеты",
      });
    }

    return {
      prioritized: result.data.prioritized,
      total: responses.length,
    };
  });
