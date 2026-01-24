import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  response,
  responseInvitation,
  responseScreening,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { generateText } from "@qbs-autonaim/lib/ai";
import { getInterviewUrlWithResponseId } from "@qbs-autonaim/server-utils";
import { createLogger, err, ok, type Result, tryCatch } from "../base";

const logger = createLogger("InvitationGenerator");

// Минимальный порог оценки для отправки приглашения (из 100)
const MIN_SCORE_THRESHOLD = 60;

interface InvitationResult {
  invitationId: string;
  invitationText: string;
  interviewUrl: string;
  score: number;
}

/**
 * Generates personalized invitation text using AI
 */
async function generateInvitationText(
  candidateName: string | null,
  vacancyTitle: string,
  interviewUrl: string,
  score: number,
): Promise<string> {
  const prompt = `Ты - HR-менеджер. Создай персонализированное приглашение на AI-интервью для фрилансера.

ИНФОРМАЦИЯ:
- Имя кандидата: ${candidateName || "Уважаемый кандидат"}
- Вакансия: ${vacancyTitle}
- Оценка отклика: ${score}/100
- Ссылка на интервью: ${interviewUrl}

ТРЕБОВАНИЯ:
1. Обращайся к кандидату по имени (если известно)
2. Упомяни, что его отклик заинтересовал
3. Объясни, что интервью проводится через AI-чат
4. Укажи примерное время прохождения (10-15 минут)
5. Добавь ссылку на интервью
6. Используй дружелюбный, но профессиональный тон
7. Текст должен быть на русском языке
8. Не используй markdown форматирование

Создай текст приглашения (только текст, без дополнительных комментариев):`;

  const { text } = await generateText({
    prompt,
    generationName: "generate-freelance-invitation",
    metadata: {
      candidateName: candidateName || "unknown",
      vacancyTitle,
      score,
    },
  });

  return text.trim();
}

/**
 * Generates invitation for qualified freelancer
 */
export async function generateFreelanceInvitation(
  responseId: string,
): Promise<Result<InvitationResult | null>> {
  logger.info(`Generating invitation for response ${responseId}`);

  // Получаем отклик с оценкой
  const responseResult = await tryCatch(async () => {
    const resp = await db.query.response.findFirst({
      where: eq(response.id, responseId),
    });

    if (!resp) {
      return null;
    }

    // Получаем screening отдельно
    const screening = await db.query.responseScreening.findFirst({
      where: eq(responseScreening.responseId, responseId),
    });

    return { ...resp, screening };
  }, "Failed to fetch response");

  if (!responseResult.success) {
    return err(responseResult.error);
  }

  const responseData = responseResult.data;
  if (!responseData) {
    return err(`Response ${responseId} not found`);
  }

  // Проверяем, что это фриланс-отклик
  if (
    responseData.importSource !== "KWORK" &&
    responseData.importSource !== "FL_RU" &&
    responseData.importSource !== "FREELANCE_RU"
  ) {
    logger.info(
      `Skipping invitation: not a freelance response (source: ${responseData.importSource})`,
    );
    return ok(null);
  }

  // Проверяем наличие скрининга
  if (!responseData.screening) {
    return err(`Screening not found for response ${responseId}`);
  }

  // Проверяем порог оценки
  if (responseData.screening.score < MIN_SCORE_THRESHOLD) {
    logger.info(
      `Skipping invitation: score ${responseData.screening.score} below threshold ${MIN_SCORE_THRESHOLD}`,
    );
    return ok(null);
  }

  // Проверяем, не было ли уже отправлено приглашение
  const existingInvitation = await db.query.responseInvitation.findFirst({
    where: eq(responseInvitation.responseId, responseId),
  });

  if (existingInvitation) {
    logger.info(`Invitation already exists for response ${responseId}`);
    return ok({
      invitationId: existingInvitation.id,
      invitationText: existingInvitation.invitationText ?? "",
      interviewUrl: existingInvitation.interviewUrl ?? "",
      score: responseData.screening.score,
    });
  }

  // Получаем вакансию с workspace и customDomain
  const vacancyResult = await tryCatch(async () => {
    return await db.query.vacancy.findFirst({
      where: eq(vacancy.id, responseData.entityId),
      with: {
        workspace: {
          columns: {
            id: true,
            customDomainId: true,
          },
          with: {
            customDomain: {
              columns: {
                domain: true,
              },
            },
          },
        },
      },
    });
  }, "Failed to fetch vacancy");

  if (!vacancyResult.success) {
    return err(vacancyResult.error);
  }

  const vacancyData = vacancyResult.data;
  if (!vacancyData) {
    return err(`Vacancy ${responseData.entityId} not found`);
  }

  // Получаем ссылку на интервью
  const interviewLinkResult = await tryCatch(async () => {
    return await db.query.interviewLink.findFirst({
      where: (link, { eq, and }) =>
        and(
          eq(link.entityType, "vacancy"),
          eq(link.entityId, responseData.entityId),
          eq(link.isActive, true),
        ),
    });
  }, "Failed to fetch interview link");

  if (!interviewLinkResult.success) {
    return err(interviewLinkResult.error);
  }

  const link = interviewLinkResult.data;
  if (!link) {
    return err(`Interview link not found for vacancy ${responseData.entityId}`);
  }

  const interviewUrl = getInterviewUrlWithResponseId(
    link.token,
    responseId,
    vacancyData.workspace.customDomain?.domain ?? null,
  );

  // Генерируем текст приглашения
  logger.info("Generating invitation text with AI");

  const screeningScore = responseData.screening?.score;
  if (!screeningScore) {
    return err("Screening score not found");
  }

  const textResult = await tryCatch(
    async () =>
      await generateInvitationText(
        responseData.candidateName,
        vacancyData.title,
        interviewUrl,
        screeningScore,
      ),
    "Failed to generate invitation text",
  );

  if (!textResult.success) {
    return err(textResult.error);
  }

  // Сохраняем приглашение
  const saveResult = await tryCatch(async () => {
    const [invitation] = await db
      .insert(responseInvitation)
      .values({
        responseId,
        invitationText: textResult.data,
        interviewUrl,
      })
      .returning();

    if (!invitation) {
      throw new Error("Failed to create invitation");
    }

    logger.info(`Invitation saved with ID ${invitation.id}`);

    return {
      invitationId: invitation.id,
      invitationText: invitation.invitationText ?? "",
      interviewUrl: invitation.interviewUrl ?? "",
      score: responseData.screening?.score ?? 0,
    };
  }, "Failed to save invitation");

  return saveResult;
}
