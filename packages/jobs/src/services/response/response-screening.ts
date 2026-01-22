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
import { getVacancyRequirements } from "../vacancy";

const logger = createLogger("ResponseScreening");

interface ScreeningResult {
  score: number;
  detailedScore: number;
  analysis: string;
  resumeLanguage: string;
  potentialScore?: number;
  careerTrajectoryScore?: number;
  careerTrajectoryType?: "growth" | "stable" | "decline" | "jump" | "role_change";
  hiddenFitIndicators?: string[];
  potentialAnalysis?: string;
  careerTrajectoryAnalysis?: string;
  hiddenFitAnalysis?: string;
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
  logger.info(`Screening response ${responseId}`);

  const responseResult = await tryCatch(async () => {
    return await db.query.response.findFirst({
      where: eq(response.id, responseId),
    });
  }, "Failed to fetch response");

  if (!responseResult.success) {
    return err(responseResult.error);
  }

  const resp = responseResult.data;
  if (!resp) {
    return err(`Response ${responseId} not found`);
  }

  const requirements = await getVacancyRequirements(resp.entityId);

  if (!requirements) {
    return err(`Requirements for vacancy ${resp.entityId} not found`);
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
