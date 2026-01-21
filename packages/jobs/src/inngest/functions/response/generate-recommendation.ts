import {
  buildCandidateRecommendationPrompt,
  CandidateRecommendationSchema,
  type EntityDataForRecommendation,
  formatRecommendationForTelegram,
} from "@qbs-autonaim/ai";
import { db } from "@qbs-autonaim/db/client";
import { gig, vacancy } from "@qbs-autonaim/db/schema";
import { generateObject, openaiProvider } from "@qbs-autonaim/lib/ai";
import { eq } from "drizzle-orm";

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

        // Санитизируем deliveryDays: если deadline в прошлом (<=0), используем undefined
        const validDeliveryDays =
          deliveryDays && deliveryDays > 0 ? deliveryDays : undefined;

        const entity: EntityDataForRecommendation = {
          type: "gig",
          title: gigData.title,
          description: gigData.description ?? undefined,
          requirements,
          budget,
          deliveryDays: validDeliveryDays,
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

        // Создаем AbortSignal с таймаутом 60 секунд
        const timeoutMs = 60_000;
        const abortSignal = AbortSignal.timeout(timeoutMs);

        try {
          const result = await generateObject({
            model: openaiProvider("gpt-4o-mini"),
            schema: CandidateRecommendationSchema,
            schemaName: "response",
            schemaDescription: "Candidate recommendation response",
            prompt: buildCandidateRecommendationPrompt(
              screening,
              candidate,
              entityData,
            ),
            generationName: "generate-candidate-recommendation",
            entityId: responseId,
            metadata: {
              responseId,
              candidateName: candidate.name,
              entityType: entityData.type,
              entityTitle: entityData.title,
            },
            abortSignal,
          });

          console.log("✅ Рекомендация сгенерирована", {
            responseId,
            level: result.object.recommendation,
          });

          return result.object;
        } catch (error) {
          // Проверяем, является ли ошибка таймаутом
          const isTimeout =
            error instanceof Error &&
            (error.name === "AbortError" ||
              error.name === "TimeoutError" ||
              error.message.includes("aborted") ||
              error.message.includes("timeout"));

          if (isTimeout) {
            console.error("⏱️ Таймаут при генерации рекомендации", {
              responseId,
              candidateName: candidate.name,
              entityType: entityData.type,
              entityTitle: entityData.title,
              timeoutMs,
            });

            throw new Error(
              `Таймаут при генерации рекомендации для кандидата ${candidate.name} по ${entityData.type} "${entityData.title}" после ${timeoutMs}ms`,
            );
          }

          // Обрабатываем сетевые ошибки
          const isNetworkError =
            error instanceof Error &&
            (error.message.includes("fetch") ||
              error.message.includes("network") ||
              error.message.includes("ECONNREFUSED") ||
              error.message.includes("ETIMEDOUT"));

          if (isNetworkError) {
            console.error("🌐 Сетевая ошибка при генерации рекомендации", {
              responseId,
              candidateName: candidate.name,
              entityType: entityData.type,
              entityTitle: entityData.title,
              error: error instanceof Error ? error.message : String(error),
            });

            throw new Error(
              `Сетевая ошибка при генерации рекомендации для кандидата ${candidate.name}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }

          // Обрабатываем другие ошибки
          console.error("❌ Ошибка при генерации рекомендации", {
            responseId,
            candidateName: candidate.name,
            entityType: entityData.type,
            entityTitle: entityData.title,
            error: error instanceof Error ? error.message : String(error),
            errorName: error instanceof Error ? error.name : undefined,
          });

          throw new Error(
            `Не удалось сгенерировать рекомендацию для кандидата ${candidate.name} по ${entityData.type} "${entityData.title}": ${error instanceof Error ? error.message : String(error)}`,
          );
        }
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

    // Отправляем рекомендацию в Telegram (если есть chatId)
    // Используем уже загруженные данные из responseData
    if (responseData.response.chatId) {
      const { candidate } = responseData;
      const formattedMessage = formatRecommendationForTelegram(
        recommendation,
        candidate.name,
        entityData.title,
      );

      await step.sendEvent("send-recommendation-telegram", {
        name: "telegram/message.send",
        data: {
          chatId: responseData.response.chatId,
          content: formattedMessage,
        },
      });

      console.log("📤 Рекомендация отправлена в Telegram", {
        responseId,
        chatId: responseData.response.chatId,
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
