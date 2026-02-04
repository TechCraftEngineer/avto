import type {
  GigRecommendationCandidateData,
  GigRecommendationGigData,
  GigRecommendationInput,
  GigRecommendationScreeningData,
} from "@qbs-autonaim/ai";
import { AgentFactory } from "@qbs-autonaim/ai";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { gig } from "@qbs-autonaim/db/schema";
import { getAIModel } from "@qbs-autonaim/lib/ai";

import {
  getResponseDataForRecommendation,
  saveRecommendation,
  toSaveData,
} from "../../../services/recommendation";
import { inngest } from "../../client";

/**
 * Inngest функция для генерации рекомендации по исполнителю на задание
 */
export const generateGigRecommendationFunction = inngest.createFunction(
  {
    id: "generate-gig-recommendation",
    name: "Generate Gig Recommendation",
    retries: 2,
  },
  { event: "response/gig-recommendation.generate" },
  async ({ event, step }) => {
    const { responseId } = event.data as {
      responseId: string;
    };

    console.log("🎯 Генерация рекомендации по исполнителю на задание", {
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

    // Получаем данные задания
    const gigData = await step.run("get-gig-data", async () => {
      const { response: resp } = responseData;

      const gigRecord = await db.query.gig.findFirst({
        where: eq(gig.id, resp.entityId),
      });

      if (!gigRecord) {
        throw new Error(`Задание не найдено: ${resp.entityId}`);
      }

      const requirements = gigRecord.requirements?.required_skills ?? undefined;

      const budget =
        gigRecord.budgetMin || gigRecord.budgetMax
          ? {
              min: gigRecord.budgetMin ?? undefined,
              max: gigRecord.budgetMax ?? undefined,
            }
          : undefined;

      const deliveryDays = gigRecord.deadline
        ? Math.ceil(
            (gigRecord.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          )
        : undefined;

      const validDeliveryDays =
        deliveryDays && deliveryDays > 0 ? deliveryDays : undefined;

      const gigInput: GigRecommendationGigData = {
        title: gigRecord.title,
        description: gigRecord.description ?? undefined,
        requirements,
        budget,
        deliveryDays: validDeliveryDays ?? null,
      };

      return gigInput;
    });

    // Подготавливаем данные исполнителя
    const candidateData = await step.run("prepare-candidate-data", async () => {
      const { candidate } = responseData;

      const candidateInput: GigRecommendationCandidateData = {
        name: candidate.name,
        experience: candidate.experience,
        skills: candidate.skills ?? undefined,
        coverLetter: candidate.coverLetter ?? undefined,
        proposedPrice: candidate.proposedPrice ?? undefined,
        proposedDeliveryDays: candidate.proposedDeliveryDays ?? undefined,
      };

      return candidateInput;
    });

    // Подготавливаем данные скрининга
    const screeningData = await step.run("prepare-screening-data", async () => {
      const { screening } = responseData;

      const screeningInput: GigRecommendationScreeningData = {
        score: screening.score,
        detailedScore: screening.detailedScore,
        analysis: screening.analysis,
        matchPercentage: screening.matchPercentage ?? undefined,
        strengths: screening.strengths ?? undefined,
        weaknesses: screening.weaknesses ?? undefined,
        summary: screening.summary ?? undefined,
      };

      return screeningInput;
    });

    // Генерируем рекомендацию через агент
    const recommendation = await step.run(
      "generate-recommendation",
      async () => {
        const { candidate } = responseData;

        try {
          const factory = new AgentFactory({
            model: getAIModel(),
          });

          const agent = factory.createGigRecommendation();

          const input: GigRecommendationInput = {
            gig: gigData,
            candidate: candidateData,
            screening: screeningData,
          };

          const result = await agent.execute(input, {});

          if (!result.success || !result.data) {
            throw new Error(
              result.error || "Не удалось сгенерировать рекомендацию",
            );
          }

          console.log("✅ Рекомендация сгенерирована", {
            responseId,
            level: result.data.recommendation,
          });

          return result.data;
        } catch (error) {
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
              gigTitle: gigData.title,
            });

            throw new Error(
              `Таймаут при генерации рекомендации для исполнителя ${candidate.name} по заданию "${gigData.title}"`,
            );
          }

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
              gigTitle: gigData.title,
              error: error instanceof Error ? error.message : String(error),
            });

            throw new Error(
              `Сетевая ошибка при генерации рекомендации для исполнителя ${candidate.name}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }

          console.error("❌ Ошибка при генерации рекомендации", {
            responseId,
            candidateName: candidate.name,
            gigTitle: gigData.title,
            error: error instanceof Error ? error.message : String(error),
            errorName: error instanceof Error ? error.name : undefined,
          });

          throw new Error(
            `Не удалось сгенерировать рекомендацию для исполнителя ${candidate.name} по заданию "${gigData.title}": ${error instanceof Error ? error.message : String(error)}`,
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

    return {
      success: true,
      responseId,
      entityType: "gig" as const,
      recommendation: {
        level: recommendation.recommendation,
        summary: recommendation.candidateSummary,
      },
    };
  },
);
