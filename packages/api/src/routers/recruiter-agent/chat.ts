/**
 * Chat procedure для AI-ассистента рекрутера
 *
 * Реализует streaming диалог с агентом через SSE
 * Requirements: 1.1, 1.2, 1.3, 7.5, 10.2
 */

import { ORPCError } from "@orpc/server";
import {
  type ConversationMessage,
  mapDBSettingsToRecruiterSettings,
  RecruiterAgentOrchestrator,
  type RecruiterStreamEvent,
  type ResponseInterviewContext,
} from "@qbs-autonaim/ai";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { formatExperienceText } from "@qbs-autonaim/shared";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";
import { checkRateLimit, checkWorkspaceAccess } from "./middleware";

/**
 * Схема сообщения в истории диалога
 */
const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.coerce.date(),
  metadata: z
    .object({
      intent: z
        .enum([
          "SEARCH_CANDIDATES",
          "ANALYZE_VACANCY",
          "GENERATE_CONTENT",
          "COMMUNICATE",
          "CONFIGURE_RULES",
          "GET_PRIORITY",
          "GET_INTERVIEW_QUESTIONS",
          "GENERAL_QUESTION",
        ])
        .optional(),
      actions: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Схема входных данных для chat
 */
const chatInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  message: z.string().min(1).max(5000),
  vacancyId: z.string().optional(),
  candidateId: z.string().optional(),
  responseId: z.string().optional(),
  conversationHistory: z.array(conversationMessageSchema).max(20).default([]),
});

/**
 * Chat procedure с streaming через SSE
 */
export const chat = protectedProcedure
  .input(chatInputSchema)
  .handler(async function* ({ input, context }) {
    const {
      workspaceId,
      message,
      vacancyId,
      candidateId,
      responseId,
      conversationHistory,
    } = input;

    // Проверка доступа к workspace
    const hasAccess = await checkWorkspaceAccess(
      context.workspaceRepository,
      workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    // Проверка rate limiting (30 запросов в минуту)
    const rateLimitKey = `chat:${workspaceId}`;
    const canProceed = await checkRateLimit(rateLimitKey, 30, 60);

    if (!canProceed) {
      throw new ORPCError("TOO_MANY_REQUESTS", {
        message: "Превышен лимит запросов",
        data: { retryAfter: 60 },
      });
    }

    // Загружаем настройки компании (Requirements: 7.5)
    const botSettings = await context.db.query.botSettings.findFirst({
      where: (cs, { eq }) => eq(cs.workspaceId, workspaceId),
    });

    // Преобразуем настройки из БД в формат для агентов
    const recruiterbotSettings = mapDBSettingsToRecruiterSettings(
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

    // TODO: Загрузка и использование feedback истории (Requirements: 10.2)
    // Требует обновления интерфейса RecruiterOrchestratorInput

    // Создаём оркестратор
    const model = getAIModel();
    const orchestrator = new RecruiterAgentOrchestrator({
      model,
      maxSteps: 10,
      maxConversationHistory: 20,
      enableStreaming: true,
    });

    // Преобразуем историю в нужный формат
    const history: ConversationMessage[] = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      metadata: msg.metadata,
    }));

    // Подгружаем контекст отклика для режима интервью (responseId + vacancyId)
    let responseContext: ResponseInterviewContext | undefined;
    if (responseId && vacancyId) {
      const [response, screening, vacancy] = await Promise.all([
        context.db.query.response.findFirst({
          where: (r, { eq, and }) =>
            and(
              eq(r.id, responseId),
              eq(r.entityType, "vacancy"),
              eq(r.entityId, vacancyId),
            ),
          columns: {
            id: true,
            globalCandidateId: true,
            coverLetter: true,
            profileUrl: true,
            profileData: true,
          },
        }),
        context.db.query.responseScreening.findFirst({
          where: (s, { eq }) => eq(s.responseId, responseId),
          columns: { overallScore: true, overallAnalysis: true },
        }),
        context.db.query.vacancy.findFirst({
          where: (v, { eq }) => eq(v.id, vacancyId),
          columns: {
            id: true,
            title: true,
            description: true,
            requirements: true,
          },
        }),
      ]);

      if (response && vacancy) {
        responseContext = {
          responseId: response.id,
          candidateId: response.globalCandidateId ?? response.id,
          vacancyId,
          candidateData: {
            resume: response.profileUrl ?? null,
            experience: formatExperienceText(response.profileData) ?? null,
            coverLetter: response.coverLetter ?? null,
            riskFactors: [],
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
            description: vacancy.description ?? null,
          },
        };
      }
    }

    // Выполняем запрос с streaming в реальном времени
    // Используем async queue для передачи событий из callback в generator
    const eventQueue: RecruiterStreamEvent[] = [];
    let resolveNext: ((value: RecruiterStreamEvent | null) => void) | null =
      null;
    let isComplete = false;

    // Функция для добавления события в очередь
    const enqueueEvent = (event: RecruiterStreamEvent) => {
      if (resolveNext) {
        // Если есть ожидающий consumer, отдаем событие сразу
        resolveNext(event);
        resolveNext = null;
      } else {
        // Иначе добавляем в очередь
        eventQueue.push(event);
      }
    };

    // Функция для получения следующего события
    const dequeueEvent = (): Promise<RecruiterStreamEvent | null> => {
      if (eventQueue.length > 0) {
        // Если в очереди есть события, возвращаем первое
        const nextEvent = eventQueue.shift();
        return Promise.resolve(nextEvent ?? null);
      }
      if (isComplete) {
        // Если streaming завершен и очередь пуста, возвращаем null
        return Promise.resolve(null);
      }
      // Иначе ждем следующего события
      return new Promise((resolve) => {
        resolveNext = resolve;
      });
    };

    // Запускаем executeWithStreaming асинхронно
    const executionPromise = orchestrator
      .executeWithStreaming(
        {
          message,
          workspaceId,
          vacancyId,
          candidateId,
          responseId,
          responseContext,
          conversationHistory: history,
        },
        recruiterbotSettings,
        enqueueEvent,
      )
      .then((output) => {
        isComplete = true;
        // Если есть ожидающий consumer, сигнализируем о завершении
        if (resolveNext) {
          resolveNext(null);
          resolveNext = null;
        }
        return output;
      })
      .catch((error) => {
        isComplete = true;
        // Если есть ожидающий consumer, сигнализируем о завершении
        if (resolveNext) {
          resolveNext(null);
          resolveNext = null;
        }
        throw error;
      });

    try {
      // Стримим события в реальном времени
      let event: RecruiterStreamEvent | null;
      while ((event = await dequeueEvent()) !== null) {
        yield event;
      }

      // Ждем завершения выполнения
      const output = await executionPromise;

      // Логируем в audit log
      await context.auditLogger.logAccess({
        userId: context.session.user.id,
        workspaceId,
        action: "ACCESS",
        resourceType: "VACANCY",
        resourceId: workspaceId,
        metadata: {
          type: "recruiter_agent_chat",
          intent: output.intent,
          actionsCount: output.actions.length,
          vacancyId,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      // Отправляем событие ошибки
      yield {
        type: "error" as const,
        timestamp: new Date(),
        error: errorMessage,
        code: "ORCHESTRATOR_ERROR",
      };

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось обработать запрос. Попробуйте позже.",
      });
    }
  });
