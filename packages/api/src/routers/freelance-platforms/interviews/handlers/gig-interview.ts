import type { Database } from "../../../../types/database";
import type { ErrorHandler } from "../../../../utils/error-handler";
import {
  createInterviewSession,
  generateWelcomeMessage,
  saveWelcomeMessage,
} from "../utils/create-interview-session";
import { createGigResponse } from "../utils/create-response";
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

export async function handleGigInterview(
  db: Database,
  gigId: string,
  freelancerInfo: FreelancerInfo,
  errorHandler: ErrorHandler,
) {
  // Получаем гиг
  const gig = await db.query.gig.findFirst({
    where: (g, { eq }) => eq(g.id, gigId),
    with: {
      workspace: {
        with: {
          botSettings: true,
        },
      },
    },
  });

  if (!gig) {
    throw await errorHandler.handleNotFoundError("Задание", { gigId });
  }

  if (!gig.isActive) {
    throw await errorHandler.handleValidationError("Задание закрыто", {
      gigId,
    });
  }

  // Проверяем существующий отклик
  const existingResponse = await findExistingResponse(
    db,
    "gig",
    gigId,
    freelancerInfo,
  );

  let response: Awaited<ReturnType<typeof createGigResponse>>;
  let shouldSyncAndParse = false;

  if (existingResponse) {
    // Используем существующий отклик
    response = existingResponse;

    const sessionResult = await handleExistingSession(
      db,
      existingResponse.id,
      existingResponse.entityId,
      "gig",
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
    response = await createGigResponse(db, gigId, freelancerInfo, errorHandler);

    // Для нового отклика нужна синхронизация и парсинг
    shouldSyncAndParse = true;
  }

  // Синхронизируем с глобальным пулом только для новых откликов
  if (shouldSyncAndParse) {
    await syncCandidateToGlobalPool(
      db,
      response.id,
      gig.workspace.organizationId,
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
    gig.title,
    "gig",
    gig.workspace?.botSettings,
  );

  await saveWelcomeMessage(db, session.id, welcomeMessage);

  return {
    type: "gig" as const,
    sessionId: session.id,
    responseId: response.id,
    entityId: response.entityId,
    welcomeMessage,
  };
}
