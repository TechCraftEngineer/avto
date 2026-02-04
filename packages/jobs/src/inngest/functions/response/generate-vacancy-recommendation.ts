import type {
  VacancyRecommendationCandidateData,
  VacancyRecommendationInput,
  VacancyRecommendationScreeningData,
  VacancyRecommendationVacancyData,
} from "@qbs-autonaim/ai";
import { AgentFactory } from "@qbs-autonaim/ai";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import { getAIModel } from "@qbs-autonaim/lib/ai";

import {
  getResponseDataForRecommendation,
  saveRecommendation,
  toSaveData,
} from "../../../services/recommendation";
import { inngest } from "../../client";

/**
 * Inngest функция для генерации рекомендации по кандидату на вакансию
 */
export const generateVacancyRecommendationFunction = inngest.createFunction(
  {
    id: "generate-vacancy-recommendation",
    name: "Generate Vacancy Recommendation",
    retries: 2,
  },
  { event: "response/vacancy-recommendation.generate" },
  async ({ event, step }) => {
    const { responseId } = event.data as {
      responseId: string;
    };

    // Получаем данные для генерации рекомендации
    const responseData = await step.run("get-response-data", async () => {
      const result = await getResponseDataForRecommendation(responseId);

      if (!result.success) {
        throw new Error(`Данные для рекомендации не найдены: ${result.error}`);
      }

      return result.data;
    });

    // Получаем данные вакансии
    const vacancyData = await step.run("get-vacancy-data", async () => {
      const { response: resp } = responseData;

      const vac = await db.query.vacancy.findFirst({
        where: eq(vacancy.id, resp.entityId),
      });

      if (!vac) {
        throw new Error(`Вакансия не найдена: ${resp.entityId}`);
      }

      const requirements = vac.requirements?.mandatory_requirements ?? [];

      const vacancyInput: VacancyRecommendationVacancyData = {
        title: vac.title,
        description: vac.description ?? undefined,
        requirements,
      };

      return vacancyInput;
    });

    // Подготавливаем данные кандидата
    const candidateData = await step.run("prepare-candidate-data", async () => {
      const { candidate } = responseData;

      const candidateInput: VacancyRecommendationCandidateData = {
        name: candidate.name,
        experience: candidate.experience,
        skills: candidate.skills ?? null,
        coverLetter: candidate.coverLetter ?? null,
        salaryExpectations: candidate.salaryExpectations ?? null,
      };

      return candidateInput;
    });

    // Подготавливаем данные скрининга
    const screeningData = await step.run("prepare-screening-data", async () => {
      const { screening } = responseData;

      const screeningInput: VacancyRecommendationScreeningData = {
        score: screening.score,
        detailedScore: screening.detailedScore,
        analysis: screening.analysis,
        matchPercentage: screening.matchPercentage ?? undefined,
        strengths: screening.strengths ? screening.strengths : [],
        weaknesses: screening.weaknesses ? screening.weaknesses : [],
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

          const agent = factory.createVacancyRecommendation();

          const input: VacancyRecommendationInput = {
            vacancy: vacancyData,
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
              vacancyTitle: vacancyData.title,
            });

            throw new Error(
              `Таймаут при генерации рекомендации для кандидата ${candidate.name} по вакансии "${vacancyData.title}"`,
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
              vacancyTitle: vacancyData.title,
              error: error instanceof Error ? error.message : String(error),
            });

            throw new Error(
              `Сетевая ошибка при генерации рекомендации для кандидата ${candidate.name}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }

          console.error("❌ Ошибка при генерации рекомендации", {
            responseId,
            candidateName: candidate.name,
            vacancyTitle: vacancyData.title,
            error: error instanceof Error ? error.message : String(error),
            errorName: error instanceof Error ? error.name : undefined,
          });

          throw new Error(
            `Не удалось сгенерировать рекомендацию для кандидата ${candidate.name} по вакансии "${vacancyData.title}": ${error instanceof Error ? error.message : String(error)}`,
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
      entityType: "vacancy" as const,
      recommendation: {
        level: recommendation.recommendation,
        summary: recommendation.candidateSummary,
      },
    };
  },
);
