import type { Database } from "../../../../types/database";
import type { ErrorHandler } from "../../../../utils/error-handler";
import {
  createInterviewSession,
  generateWelcomeMessage,
  saveWelcomeMessage,
} from "../utils/create-interview-session";
import { createVacancyResponse } from "../utils/create-response";
import { findExistingResponse } from "../utils/find-existing-response";
import { handleExistingSession } from "../utils/handle-existing-session";
import { syncCandidateToGlobalPool } from "../utils/sync-candidate";
import { triggerProfileParsing } from "../utils/trigger-profile-parsing";

interface FreelancerInfo {
  name: string;
  email?: string;
  platformProfileUrl?: string;
  phone?: string;
  telegram?: string;
}

export async function handleVacancyInterview(
  db: Database,
  vacancyId: string,
  freelancerInfo: FreelancerInfo,
  errorHandler: ErrorHandler,
) {
  // Получаем вакансию
  const vacancy = await db.query.vacancy.findFirst({
    where: (v, { eq }) => eq(v.id, vacancyId),
    with: {
      workspace: {
        with: {
          botSettings: true,
        },
      },
    },
  });

  if (!vacancy) {
    throw await errorHandler.handleNotFoundError("Вакансия", { vacancyId });
  }

  if (!vacancy.isActive) {
    throw await errorHandler.handleValidationError("Вакансия закрыта", {
      vacancyId,
    });
  }

  // Проверяем существующий отклик
  const existingResponse = await findExistingResponse(
    db,
    "vacancy",
    vacancyId,
    freelancerInfo,
  );

  let response: Awaited<ReturnType<typeof createVacancyResponse>>;
  let shouldSyncAndParse = false;

  if (existingResponse) {
    // Используем существующий отклик
    response = existingResponse;

    const sessionResult = await handleExistingSession(
      db,
      existingResponse.id,
      existingResponse.entityId,
      "vacancy",
      freelancerInfo,
      errorHandler,
    );

    // Если handleExistingSession вернул результат - возвращаем его
    if (sessionResult) {
      return sessionResult;
    }

    // Если вернул null - нужно создать новую сессию для существующего отклика
    // Синхронизацию и парсинг НЕ запускаем, т.к. отклик уже обработан
  } else {
    // Создаём новый отклик
    response = await createVacancyResponse(
      db,
      vacancyId,
      freelancerInfo,
      errorHandler,
    );

    // Для нового отклика нужна синхронизация и парсинг
    shouldSyncAndParse = true;
  }

  // Синхронизируем с глобальным пулом только для новых откликов
  if (shouldSyncAndParse) {
    await syncCandidateToGlobalPool(
      db,
      response.id,
      vacancy.workspace.organizationId,
      freelancerInfo,
    );

    // Запускаем парсинг профиля
    await triggerProfileParsing(response.id);
  }

  // Создаём сессию интервью
  const session = await createInterviewSession(
    db,
    response.id,
    freelancerInfo,
    errorHandler,
  );

  // Генерируем и сохраняем приветственное сообщение
  const welcomeMessage = generateWelcomeMessage(
    freelancerInfo.name,
    vacancy.title,
    "vacancy",
    vacancy.workspace?.botSettings,
  );

  await saveWelcomeMessage(db, session.id, welcomeMessage);

  return {
    type: "vacancy" as const,
    sessionId: session.id,
    responseId: response.id,
    entityId: response.entityId,
    welcomeMessage,
  };
}
