import type { db as DbType } from "@qbs-autonaim/db/client";
/**
 * Результат валидации токена интервью
 */
export interface ValidatedInterviewToken {
  type: "vacancy" | "gig";
  tokenId: string;
  entityId: string; // vacancyId, gigId или responseId (для entityType === "response")
  entityType: "vacancy" | "gig" | "response"; // Тип сущности в interview_link
  token: string;
}

/**
 * Валидирует токен интервью и возвращает информацию о нём
 * Проверяет существование, активность и срок действия
 */
export async function validateInterviewToken(
  token: string,
  db: typeof DbType,
): Promise<ValidatedInterviewToken | null> {
  if (!token || token.trim().length === 0) {
    return null;
  }

  // Проверяем в универсальной таблице interview_links
  const link = await db.query.interviewLink.findFirst({
    where: (l, { eq, and }) => and(eq(l.token, token), eq(l.isActive, true)),
  });

  if (!link) {
    return null;
  }

  // Проверяем срок действия
  if (link.expiresAt && link.expiresAt < new Date()) {
    return null;
  }

  // Определяем тип на основе entityType
  // Для response нужно получить реальный тип из отклика
  let type: "vacancy" | "gig" = "vacancy";

  if (link.entityType === "gig") {
    type = "gig";
  } else if (link.entityType === "response") {
    // Получаем отклик чтобы узнать реальный тип
    const response = await db.query.response.findFirst({
      where: (r, { eq }) => eq(r.id, link.entityId),
      columns: { entityType: true },
    });
    type = response?.entityType === "gig" ? "gig" : "vacancy";
  }

  return {
    type,
    tokenId: link.id,
    entityId: link.entityId,
    entityType: link.entityType as "vacancy" | "gig" | "response",
    token: link.token,
  };
}

/**
 * Проверяет, имеет ли токен доступ к указанной вакансии
 */
export function hasVacancyAccess(
  validatedToken: ValidatedInterviewToken | null,
  vacancyId: string,
): boolean {
  return (
    validatedToken !== null &&
    validatedToken.type === "vacancy" &&
    validatedToken.entityId === vacancyId
  );
}

/**
 * Проверяет, имеет ли токен доступ к указанному гигу
 */
export function hasGigAccess(
  validatedToken: ValidatedInterviewToken | null,
  gigId: string,
): boolean {
  return (
    validatedToken !== null &&
    validatedToken.type === "gig" &&
    validatedToken.entityId === gigId
  );
}

/**
 * Проверяет, имеет ли токен доступ к interviewSession
 * Интервью проходят анонимно, доступ только по токену
 */
export async function hasInterviewAccess(
  sessionId: string,
  validatedToken: ValidatedInterviewToken | null,
  db: typeof DbType,
): Promise<boolean> {
  // Без токена доступа нет
  if (!validatedToken) {
    return false;
  }

  // Получаем interviewSession
  const session = await db.query.interviewSession.findFirst({
    where: (interviewSession, { eq }) => eq(interviewSession.id, sessionId),
  });
  if (!session) {
    return false;
  }

  // Получаем response
  const responseRecord = await db.query.response.findFirst({
    where: (r, { eq }) => eq(r.id, session.responseId),
  });
  if (!responseRecord) {
    return false;
  }
  // Для токенов типа "response" проверяем соответствие responseId напрямую
  if (
    validatedToken.entityType === "response" &&
    validatedToken.entityId === responseRecord.id
  ) {
    return true;
  }

  // Для токенов типа "vacancy" или "gig" проверяем соответствие entityType и entityId
  if (
    validatedToken.entityType !== "response" &&
    validatedToken.type === responseRecord.entityType &&
    validatedToken.entityId === responseRecord.entityId
  ) {
    return true;
  }

  return false;
}

/**
 * Извлекает токен из заголовков запроса
 * Поддерживает Authorization: Bearer <token> и x-interview-token: <token>
 */
export function extractTokenFromHeaders(headers: Headers): string | null {
  // Проверяем Authorization header
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Проверяем кастомный header
  const customHeader = headers.get("x-interview-token");
  if (customHeader) {
    return customHeader;
  }

  return null;
}
