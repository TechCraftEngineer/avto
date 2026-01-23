import { buildResponseScreeningPrompt } from "@qbs-autonaim/ai";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  RESPONSE_STATUS,
  response,
  responseScreening,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { generateText } from "@qbs-autonaim/lib/ai";
import { stripHtml } from "string-strip-html";
import { responseScreeningResultSchema } from "../../schemas/response-screening.schema";
import { extractJsonFromText } from "../../utils/json-extractor";
import { createLogger, err, type Result, tryCatch } from "../base";
import { extractVacancyRequirements, getVacancyRequirements } from "../vacancy";

const logger = createLogger("ResponseScreening");

interface ScreeningResult {
  score: number;
  detailedScore: number;
  analysis: string;
  resumeLanguage: string;
  potentialScore?: number | null;
  careerTrajectoryScore?: number | null;
  careerTrajectoryType?:
    | "growth"
    | "stable"
    | "decline"
    | "jump"
    | "role_change"
    | null;
  hiddenFitIndicators?: string[] | null;
  potentialAnalysis?: string | null;
  careerTrajectoryAnalysis?: string | null;
  hiddenFitAnalysis?: string | null;
}

/**
 * Parses AI screening result
 */
function parseScreeningResult(text: string): ScreeningResult {
  const extracted = extractJsonFromText(text);

  if (!extracted) {
    throw new Error("JSON не найден в ответе ИИ");
  }

  return responseScreeningResultSchema.parse(extracted);
}

/**
 * Screens response and generates evaluation
 */
export async function screenResponse(
  responseId: string,
): Promise<Result<ScreeningResult>> {
  logger.info(`Начинаем скрининг отклика ${responseId}`);

  const responseResult = await tryCatch(async () => {
    return await db.query.response.findFirst({
      where: eq(response.id, responseId),
    });
  }, "Не удалось получить отклик из базы данных");

  if (!responseResult.success) {
    return err(`Не удалось получить отклик ${responseId}: ${responseResult.error}`);
  }

  const resp = responseResult.data;
  if (!resp) {
    return err(`Отклик ${responseId} не найден в базе данных`);
  }

  let requirements = await getVacancyRequirements(resp.entityId);

  // If requirements are not found, try to extract them synchronously
  if (!requirements) {
    logger.warn(`Requirements not found for vacancy ${resp.entityId}, attempting to extract synchronously`);

    // Get vacancy description to extract requirements
    const vacancyData = await tryCatch(async () => {
      return await db.query.vacancy.findFirst({
        where: eq(vacancy.id, resp.entityId),
        columns: {
          description: true,
        },
      });
    }, "Failed to fetch vacancy description");

    if (!vacancyData.success || !vacancyData.data?.description?.trim()) {
      return err(`Требования для вакансии ${resp.entityId} не найдены и нет описания для извлечения`);
    }

    // Try to extract requirements synchronously
    const extractResult = await extractVacancyRequirements(resp.entityId, vacancyData.data.description);

    if (!extractResult.success) {
      return err(`Не удалось извлечь требования для вакансии ${resp.entityId}: ${extractResult.error}`);
    }

    requirements = extractResult.data;
    logger.info(`Requirements extracted synchronously for vacancy ${resp.entityId}`);
  }

  // Получаем кастомный промпт из вакансии
  const vacancyResult = await tryCatch(async () => {
    return await db.query.vacancy.findFirst({
      where: eq(vacancy.id, resp.entityId),
      columns: {
        customScreeningPrompt: true,
      },
    });
  }, "Failed to fetch vacancy settings");

  const customPrompt = vacancyResult.success
    ? vacancyResult.data?.customScreeningPrompt
    : null;

  const prompt = buildResponseScreeningPrompt(
    {
      candidateName: resp.candidateName || null,
      experience: resp.experience ? stripHtml(resp.experience).result : null,
      coverLetter: resp.coverLetter || null,
    },
    requirements,
    customPrompt,
  );

  logger.info("Sending request to AI for screening");

  const aiResult = await tryCatch(async () => {
    const { text } = await generateText({
      prompt,
      generationName: "screen-response",
      entityId: responseId,
      metadata: {
        responseId,
        vacancyId: resp.entityId,
      },
    });
    return text;
  }, "AI request failed");

  if (!aiResult.success) {
    return err(aiResult.error);
  }

  logger.info("Received AI response");

  const saveResult = await tryCatch(async () => {
    const result = parseScreeningResult(aiResult.data);

    // Check if screening record exists
    const existingScreening = await db.query.responseScreening.findFirst({
      where: eq(responseScreening.responseId, responseId),
    });

    if (existingScreening) {
      await db
        .update(responseScreening)
        .set({
          score: result.score,
          detailedScore: result.detailedScore,
          analysis: result.analysis,
          potentialScore: result.potentialScore ?? null,
          careerTrajectoryScore: result.careerTrajectoryScore ?? null,
          careerTrajectoryType: result.careerTrajectoryType ?? null,
          hiddenFitIndicators: result.hiddenFitIndicators ?? null,
          potentialAnalysis: result.potentialAnalysis ?? null,
          careerTrajectoryAnalysis: result.careerTrajectoryAnalysis ?? null,
          hiddenFitAnalysis: result.hiddenFitAnalysis ?? null,
        })
        .where(eq(responseScreening.responseId, responseId));
    } else {
      await db.insert(responseScreening).values({
        responseId,
        score: result.score,
        detailedScore: result.detailedScore,
        analysis: result.analysis,
        potentialScore: result.potentialScore ?? null,
        careerTrajectoryScore: result.careerTrajectoryScore ?? null,
        careerTrajectoryType: result.careerTrajectoryType ?? null,
        hiddenFitIndicators: result.hiddenFitIndicators ?? null,
        potentialAnalysis: result.potentialAnalysis ?? null,
        careerTrajectoryAnalysis: result.careerTrajectoryAnalysis ?? null,
        hiddenFitAnalysis: result.hiddenFitAnalysis ?? null,
      });
    }

    // Обновляем статус и язык резюме
    await db
      .update(response)
      .set({
        status: RESPONSE_STATUS.EVALUATED,
        resumeLanguage: result.resumeLanguage,
      })
      .where(eq(response.id, responseId));

    logger.info(
      `Screening result saved: score ${result.score}/5 (${result.detailedScore}/100), language: ${result.resumeLanguage}`,
    );

    return result;
  }, "Failed to save screening result");

  return saveResult;
}
