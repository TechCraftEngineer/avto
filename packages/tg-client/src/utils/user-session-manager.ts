/**
 * Управление личными Telegram-сессиями пользователей
 */

import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { userTelegramSession } from "@qbs-autonaim/db/schema";

/**
 * Помечает личную сессию как недействительную
 */
export async function markUserSessionAsInvalid(
  sessionId: string,
  errorType: string,
  _errorMessage: string,
): Promise<void> {
  await db
    .update(userTelegramSession)
    .set({
      isActive: false,
      authError: errorType,
      authErrorAt: new Date(),
    })
    .where(eq(userTelegramSession.id, sessionId));

  console.log(
    `📛 Личная сессия ${sessionId} помечена как недействительная: ${errorType}`,
  );
}

/**
 * Получает все активные личные сессии
 */
export async function getActiveUserSessions(): Promise<
  (typeof userTelegramSession.$inferSelect)[]
> {
  return db
    .select()
    .from(userTelegramSession)
    .where(eq(userTelegramSession.isActive, true));
}

/**
 * Получает сессию по userId
 */
export async function getSessionByUser(
  userId: string,
): Promise<typeof userTelegramSession.$inferSelect | undefined> {
  const [session] = await db
    .select()
    .from(userTelegramSession)
    .where(eq(userTelegramSession.userId, userId))
    .limit(1);

  return session;
}

/**
 * Сохраняет данные личной сессии
 */
export async function saveUserSessionData(
  sessionId: string,
  sessionData: Record<string, string>,
): Promise<void> {
  try {
    await db
      .update(userTelegramSession)
      .set({
        sessionData,
        updatedAt: new Date(),
      })
      .where(eq(userTelegramSession.id, sessionId));

    console.log(`💾 Кэш личной сессии ${sessionId} сохранен в БД`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Ошибка сохранения данных личной сессии:`, {
      sessionId,
      error: errorMessage,
    });
    throw error;
  }
}
