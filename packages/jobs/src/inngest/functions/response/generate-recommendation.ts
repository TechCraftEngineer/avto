import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { eq } from "drizzle-orm";

import {
  buildCandidateRecommendationPrompt,
  CandidateRecommendationSchema,
  formatRecommendationForTelegram,
  type EntityDataForRecommendation,
} from "@qbs-autonaim/ai";
import { db } from "@qbs-autonaim/db/client";
import { gig, response, vacancy } from "@qbs-autonaim/db/schema";

import {
  getResponseDataForRecommendation,
  saveRecommendation,
  toSaveData,
} from "../../../services/recommendation";
import { inngest } from "../../client";

/**
 * Inngest функция для генерации рекомендации по кандидату после скоринга
 */
export const generateRecommendationFunction = inngest.createFunction(
  {
    id: "generate-candidate-recommendation",
    name: "Generate Candidate Recommendation",
    retries: 2,
  },
  { event: "response/recommendation.generate" },
  async ({ event, step }) => {
    const { responseId } = event.data as {
      responseId: string;
    };

    console.log("🎯 Генерация рекомендации по кандидату", {
      responseId,
    });

    // Получаем данные для генерации рекомендации
    const responseData = await step.run("get-response-data", async () => {
      const result = await getResponseDataForRecommendation(responseId);

      if (!result.success) {
        throw new Error(`Данные для рекомендации не найдены: ${result.error}`);
      }

      return result.data;
    });

    // Получаем данные entity (vacancy или gig)
    const entityData = await step.run("get-entity-data", async () => {
      const { response: resp } = responseData;

      // Проверяем тип entity через entityType
      if (resp.entityType === "vacancy") {
        const vac = await db.query.vacancy.findFirst({
          where: eq(vacancy.id, resp.entityId),
        });

        if (!vac) {
          throw new Error(`Вакансия не найдена: ${resp.entityId}`);
        }

        // Извлекаем mandatory_requirements из JSONB объекта VacancyRequirements
        const requirements =
          vac.requirements?.mandatory_requirements ?? undefined;

        const entity: EntityDataForRecommendation = {
          type: "vacancy",
          title: vac.title,
          description: vac.description ?? undefined,
          requirements,
        };

        return entity;
      }

      if (resp.entityType === "gig") {
        const gigData = await db.query.gig.findFirst({
          where: eq(gig.id, resp.entityId),
        });

        if (!gigData) {
          throw new Error(`Gig не найден: ${resp.entityId}`);
        }

        // Извлекаем required_skills из JSONB объекта GigRequirements
        const requirements = gigData.requirements?.required_skills ?? undefined;

        // Формируем budget из budgetMin и budgetMax
        const budget =
          gigData.budgetMin || gigData.budgetMax
            ? {
                min: gigData.budgetMin ?? undefined,
                max: gigData.budgetMax ?? undefined,
              }
            : undefined;

        // Вычисляем количество дней до deadline
        const deliveryDays = gigData.deadline
          ? Math.ceil(
              (gigData.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            )
          : undefined;

        const entity: EntityDataForRecommendation = {
          type: "gig",
          title: gigData.title,
          description: gigData.description ?? undefined,
          requirements,
          budget,
          deliveryDays,
        };

        return entity;
      }

      // Обрабатываем случай project (не поддерживается)
      if (resp.entityType === "project") {
        throw new Error(
          "Генерация рекомендаций для project пока не поддерживается",
        );
      }

      throw new Error(`Неподдерживаемый тип entity: ${resp.entityType}`);
    });

    // Генерируем рекомендацию через AI
    const recommendation = await step.run(
      "generate-recommendation",
      async () => {
        const { screening, candidate } = responseData;

        const result = await generateObject({
          model: openai("gpt-4o-mini"),
          schema: CandidateRecommendationSchema,
          prompt: buildCandidateRecommendationPrompt(
            screening,
            candidate,
            entityData,
          ),
        });

        console.log("✅ Рекомендация сгенерирована", {
          responseId,
          level: result.object.recommendation,
        });

        return result.object;
      },
    );

    // Сохраняем рекомендацию
    await step.run("save-recommendation", async () => {
      const saveData = toSaveData(responseId, recommendation);
      await saveRecommendation(saveData);

      console.log("✅ Рекомендация сохранена", {
        responseId,
      });
    });

    // Получаем chatId для отправки в Telegram
    const resp = await step.run("get-chat-info", async () => {
      const r = await db.query.response.findFirst({
        where: eq(response.id, responseId),
      });
      return r;
    });

    // Отправляем рекомендацию в Telegram (если есть chatId)
    if (resp?.chatId) {
      const { candidate } = responseData;
      const formattedMessage = formatRecommendationForTelegram(
        recommendation,
        candidate.name,
        entityData.title,
      );

      await step.sendEvent("send-recommendation-telegram", {
        name: "telegram/message.send",
        data: {
          chatId: resp.chatId,
          content: formattedMessage,
        },
      });

      console.log("📤 Рекомендация отправлена в Telegram", {
        responseId,
        chatId: resp.chatId,
      });
    }

    return {
      success: true,
      responseId,
      entityType: entityData.type,
      recommendation: {
        level: recommendation.recommendation,
        summary: recommendation.candidateSummary,
      },
    };
  },
);
