import { hasInterviewAccess, validateInterviewToken } from "@qbs-autonaim/api";
import { eq } from "@qbs-autonaim/db";
import type { Database } from "@qbs-autonaim/db/client";
import { InterviewSDKError } from "@qbs-autonaim/lib/errors";

/**
 * Проверка доступа к интервью
 */
export async function checkInterviewAccess(
  sessionId: string,
  interviewToken: string | null | undefined,
  db: Database,
) {
  let validatedToken = null;

  if (interviewToken) {
    try {
      validatedToken = await validateInterviewToken(interviewToken, db);
    } catch (error) {
      console.error("[Interview Access] Не удалось валидировать токен:", error);
    }
  }

  const accessAllowed = await hasInterviewAccess(sessionId, validatedToken, db);

  if (!accessAllowed) {
    throw new InterviewSDKError("forbidden:interview", "Доступ запрещён");
  }
}

/**
 * Загрузка и валидация сессии интервью
 */
export async function loadInterviewSession(sessionId: string, db: Database) {
  const session = await db.query.interviewSession.findFirst({
    where: (s, { and }) => and(eq(s.id, sessionId), eq(s.lastChannel, "web")),
    with: {
      messages: {
        with: { file: true },
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  });

  if (!session) {
    throw new InterviewSDKError("not_found:interview", "Интервью не найдено");
  }

  if (session.status !== "active") {
    throw new InterviewSDKError("forbidden:interview", "Интервью неактивно");
  }

  return session;
}
