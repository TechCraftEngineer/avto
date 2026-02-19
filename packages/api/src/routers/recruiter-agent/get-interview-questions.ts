/**
 * Get Interview Questions procedure для генерации вопросов интервью
 */

import {
  InterviewQuestionsAgent,
  type InterviewQuestionsAgentInput,
  mapDBSettingsToRecruiterSettings,
} from "@qbs-autonaim/ai";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { formatExperienceText } from "@qbs-autonaim/shared";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { checkRateLimit, checkWorkspaceAccess } from "./middleware";

/**
 * Get Interview Questions procedure
 */
export const getInterviewQuestions = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string(),
      responseId: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const { workspaceId, vacancyId, responseId } = input;

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
    const rateLimitKey = `interview-questions:${workspaceId}`;
    const canProceed = await checkRateLimit(rateLimitKey, 20, 60);

    if (!canProceed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Превышен лимит запросов. Попробуйте через минуту.",
      });
    }

    // Получаем данные отклика
    const response = await ctx.db.query.response.findFirst({
      where: (r, { eq, and }) =>
        and(
          eq(r.id, responseId),
          eq(r.entityType, "vacancy"),
          eq(r.entityId, vacancyId),
        ),
      columns: {
        id: true,
        candidateName: true,
        coverLetter: true,
        profileUrl: true,
        profileData: true,
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    // Получаем скрининг для отклика
    const screening = await ctx.db.query.responseScreening.findFirst({
      where: (s, { eq }) => eq(s.responseId, responseId),
      columns: {
        overallScore: true,
        overallAnalysis: true,
      },
    });

    // Получаем данные вакансии
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, vacancyId),
      columns: {
        id: true,
        title: true,
        description: true,
        requirements: true,
      },
    });

    if (!vacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Формируем риск-факторы из скрининга (пока пустой массив, так как поле не существует в схеме)
    const riskFactors: Array<{
      type: string;
      description: string;
      severity: "low" | "medium" | "high";
    }> = [];

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

    // Создаём InterviewQuestionsAgent
    const model = getAIModel();
    const questionsAgent = new InterviewQuestionsAgent({
      model,
      maxSteps: 5,
    });

    // Формируем данные для агента
    const agentInput: InterviewQuestionsAgentInput = {
      candidateId: response.id,
      responseId: response.id,
      vacancyId,
      candidateData: {
        resume: response.profileUrl || null,
        experience: formatExperienceText(response.profileData) || null,
        coverLetter: response.coverLetter || null,
        riskFactors,
        screening: screening
          ? {
              score: screening.overallScore ?? undefined,
              analysis: screening.overallAnalysis ?? undefined,
            }
          : undefined,
      },
      vacancyData: {
        title: vacancy.title,
        requirements: vacancy.requirements
          ? JSON.stringify(vacancy.requirements)
          : null,
        description: vacancy.description || null,
      },
    };

    // Выполняем генерацию вопросов
    const result = await questionsAgent.execute(agentInput, {
      workspaceId,
      userId: ctx.session.user.id,
      currentVacancyId: vacancyId,
      recruiterConversationHistory: [],
      recruiterCompanySettings: recruiterSettings,
      recentDecisions: [],
      conversationHistory: [],
    });

    if (!result.success || !result.data) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: result.error || "Не удалось сгенерировать вопросы",
      });
    }

    return result.data;
  });
