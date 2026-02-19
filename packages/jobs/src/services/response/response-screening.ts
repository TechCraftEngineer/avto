import {
  AgentFactory,
  type NumerologyInput,
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
import { parseBirthDate } from "@qbs-autonaim/lib";
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
      birthDate: resp.birthDate ? parseBirthDate(resp.birthDate) : null,
    },
    requirements,
    customPrompt,
  };

  logger.info("Запуск агента скрининга");

  // Создаем фабрику агентов
  const factory = new AgentFactory({
    model: getAIModel(),
    traceId: responseId,
  });

  const agent = factory.createResponseScreening();

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
    // Проверяем наличие даты рождения для психометрического анализа личности
    let psychometricScore: number | null = null;
    let psychometricAnalysis: {
      compatibilityScore: number;
      summary: string;
      strengths: string[];
      challenges: string[];
      recommendations: string[];
    } | null = null;

    if (resp.birthDate) {
      logger.info(
        "Обнаружена дата рождения, запускаем психометрический анализ личности",
      );

      // Получаем полную информацию о вакансии для анализа совместимости
      const vacancyData = await db.query.vacancy.findFirst({
        where: eq(vacancy.id, resp.entityId),
        columns: {
          title: true,
          description: true,
          requirements: true,
          workspaceId: true,
        },
        with: {
          workspace: {
            columns: {
              name: true,
            },
          },
        },
      });

      if (vacancyData) {
        try {
          // Подготавливаем входные данные для анализа личностных характеристик
          const numerologyInput: NumerologyInput = {
            birthDate: new Date(resp.birthDate),
            candidateName: resp.candidateName || null,
            vacancy: {
              title: vacancyData.title,
              summary: vacancyData.requirements?.summary || "",
              companyName: vacancyData.workspace?.name,
              requiredSkills: vacancyData.requirements?.tech_stack || [],
              workEnvironment: vacancyData.description || undefined,
            },
          };

          // Создаем и запускаем агента психометрического анализа
          const numerologyAgent = factory.createNumerology();

          const numerologyResult = await numerologyAgent.execute(
            numerologyInput,
            {
              entityId: responseId,
              metadata: {
                responseId,
                vacancyId: resp.entityId,
              },
            },
          );

          if (numerologyResult.success && numerologyResult.data) {
            psychometricScore = numerologyResult.data.compatibilityScore;
            psychometricAnalysis = numerologyResult.data;
            logger.info(
              `Психометрический анализ завершен: оценка совместимости ${psychometricScore}/100`,
            );
          } else {
            logger.warn(
              `Психометрический анализ не удался: ${numerologyResult.error}`,
            );
          }
        } catch (error) {
          logger.error(
            `Ошибка при выполнении психометрического анализа: ${error}`,
          );
          // Не прерываем процесс скрининга, если анализ личности не удался
        }
      }
    }

    // Check if screening record exists
    const existingScreening = await db.query.responseScreening.findFirst({
      where: eq(responseScreening.responseId, responseId),
    });

    const result = screeningResult;

    if (existingScreening) {
      await db
        .update(responseScreening)
        .set({
          overallScore: result.detailedScore,
          overallAnalysis: result.analysis,
          skillsMatchScore: result.skillsMatchScore,
          experienceScore: result.experienceScore,
          potentialScore: result.potentialScore,
          careerTrajectoryScore: result.careerTrajectoryScore ?? null,
          careerTrajectoryType: result.careerTrajectoryType ?? null,
          hiddenFitIndicators: result.hiddenFitIndicators ?? null,
          skillsAnalysis: result.skillsAnalysis,
          experienceAnalysis: result.experienceAnalysis,
          potentialAnalysis: result.potentialAnalysis,
          careerTrajectoryAnalysis: result.careerTrajectoryAnalysis ?? null,
          hiddenFitAnalysis: result.hiddenFitAnalysis ?? null,
          strengths: result.strengths ?? null,
          weaknesses: result.weaknesses ?? null,
          recommendation: result.recommendation ?? null,
          psychometricScore,
          psychometricAnalysis,
        })
        .where(eq(responseScreening.responseId, responseId));
    } else {
      await db.insert(responseScreening).values({
        responseId,
        overallScore: result.detailedScore,
        overallAnalysis: result.analysis,
        skillsMatchScore: result.skillsMatchScore,
        experienceScore: result.experienceScore,
        potentialScore: result.potentialScore,
        careerTrajectoryScore: result.careerTrajectoryScore ?? null,
        careerTrajectoryType: result.careerTrajectoryType ?? null,
        hiddenFitIndicators: result.hiddenFitIndicators ?? null,
        skillsAnalysis: result.skillsAnalysis,
        experienceAnalysis: result.experienceAnalysis,
        potentialAnalysis: result.potentialAnalysis,
        careerTrajectoryAnalysis: result.careerTrajectoryAnalysis ?? null,
        hiddenFitAnalysis: result.hiddenFitAnalysis ?? null,
        strengths: result.strengths ?? null,
        weaknesses: result.weaknesses ?? null,
        recommendation: result.recommendation ?? null,
        psychometricScore,
        psychometricAnalysis,
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
      `Результат скрининга сохранен: оценка ${screeningResult.detailedScore}/100, язык: ${screeningResult.resumeLanguage}${psychometricScore ? `, психометрия: ${psychometricScore}/100` : ""}`,
    );

    return screeningResult;
  }, "Не удалось сохранить результат скрининга");

  return saveResult;
}
