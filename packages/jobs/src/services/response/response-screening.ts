import {
  ResponseScreeningAgent,
  type ResponseScreeningInput,
  type ResponseScreeningOutput,
} from "@qbs-autonaim/ai";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  RESPONSE_STATUS,
  response,
  responseScreening,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { createLogger, err, type Result, tryCatch } from "../base";
import { extractVacancyRequirements, getVacancyRequirements } from "../vacancy";

const logger = createLogger("ResponseScreening");

// Используем тип из агента
type ScreeningResult = ResponseScreeningOutput;

/**
 * Screens response and generates evaluation using AI agent
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
    return err(
      `Не удалось получить отклик ${responseId}: ${responseResult.error}`,
    );
  }

  const resp = responseResult.data;
  if (!resp) {
    return err(`Отклик ${responseId} не найден в базе данных`);
  }

  let requirements = await getVacancyRequirements(resp.entityId);

  // If requirements are not found, try to extract them synchronously
  if (!requirements) {
    logger.warn(
      `Требования для вакансии ${resp.entityId} не найдены, пытаемся извлечь синхронно`,
    );

    // Get vacancy description to extract requirements
    const vacancyData = await tryCatch(async () => {
      return await db.query.vacancy.findFirst({
        where: eq(vacancy.id, resp.entityId),
        columns: {
          description: true,
        },
      });
    }, "Не удалось получить описание вакансии");

    if (!vacancyData.success || !vacancyData.data?.description?.trim()) {
      return err(
        `Требования для вакансии ${resp.entityId} не найдены и нет описания для извлечения`,
      );
    }

    // Try to extract requirements synchronously
    const extractResult = await extractVacancyRequirements(
      resp.entityId,
      vacancyData.data.description,
    );

    if (!extractResult.success) {
      return err(
        `Не удалось извлечь требования для вакансии ${resp.entityId}: ${extractResult.error}`,
      );
    }

    requirements = extractResult.data;
    logger.info(`Требования извлечены синхронно для вакансии ${resp.entityId}`);
  }

  // Получаем кастомный промпт из вакансии
  const vacancyResult = await tryCatch(async () => {
    return await db.query.vacancy.findFirst({
      where: eq(vacancy.id, resp.entityId),
      columns: {
        customScreeningPrompt: true,
      },
    });
  }, "Не удалось получить настройки вакансии");

  const customPrompt = vacancyResult.success
    ? vacancyResult.data?.customScreeningPrompt
    : null;

  // Подготавливаем входные данные для агента
  const agentInput: ResponseScreeningInput = {
    candidate: {
      candidateName: resp.candidateName || null,
      coverLetter: resp.coverLetter || null,
      profileData: resp.profileData || null,
    },
    requirements,
    customPrompt,
  };

  logger.info("Запуск агента скрининга");

  // Создаем и запускаем агента с моделью по умолчанию
  const agent = new ResponseScreeningAgent({
    model: getAIModel(),
  });

  // Агент возвращает свой формат результата
  const agentResult = await agent.execute(agentInput, {
    entityId: responseId,
    metadata: {
      responseId,
      vacancyId: resp.entityId,
    },
  });

  if (!agentResult.success || !agentResult.data) {
    return err(agentResult.error || "Агент не вернул данные");
  }

  logger.info("Получен результат от агента скрининга");

  const screeningResult = agentResult.data;

  const saveResult = await tryCatch(async () => {
    // Check if screening record exists
    const existingScreening = await db.query.responseScreening.findFirst({
      where: eq(responseScreening.responseId, responseId),
    });

    if (existingScreening) {
      await db
        .update(responseScreening)
        .set({
          score: screeningResult.score,
          detailedScore: screeningResult.detailedScore,
          analysis: screeningResult.analysis,
          potentialScore: screeningResult.potentialScore ?? null,
          careerTrajectoryScore: screeningResult.careerTrajectoryScore ?? null,
          careerTrajectoryType: screeningResult.careerTrajectoryType ?? null,
          hiddenFitIndicators: screeningResult.hiddenFitIndicators ?? null,
          potentialAnalysis: screeningResult.potentialAnalysis ?? null,
          careerTrajectoryAnalysis:
            screeningResult.careerTrajectoryAnalysis ?? null,
          hiddenFitAnalysis: screeningResult.hiddenFitAnalysis ?? null,
        })
        .where(eq(responseScreening.responseId, responseId));
    } else {
      await db.insert(responseScreening).values({
        responseId,
        score: screeningResult.score,
        detailedScore: screeningResult.detailedScore,
        analysis: screeningResult.analysis,
        potentialScore: screeningResult.potentialScore ?? null,
        careerTrajectoryScore: screeningResult.careerTrajectoryScore ?? null,
        careerTrajectoryType: screeningResult.careerTrajectoryType ?? null,
        hiddenFitIndicators: screeningResult.hiddenFitIndicators ?? null,
        potentialAnalysis: screeningResult.potentialAnalysis ?? null,
        careerTrajectoryAnalysis:
          screeningResult.careerTrajectoryAnalysis ?? null,
        hiddenFitAnalysis: screeningResult.hiddenFitAnalysis ?? null,
      });
    }

    // Обновляем статус и язык резюме
    await db
      .update(response)
      .set({
        status: RESPONSE_STATUS.EVALUATED,
        resumeLanguage: screeningResult.resumeLanguage,
      })
      .where(eq(response.id, responseId));

    logger.info(
      `Результат скрининга сохранен: оценка ${screeningResult.score}/5 (${screeningResult.detailedScore}/100), язык: ${screeningResult.resumeLanguage}`,
    );

    return screeningResult;
  }, "Не удалось сохранить результат скрининга");

  return saveResult;
}
