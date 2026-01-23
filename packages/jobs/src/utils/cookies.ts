import {
  loadCookiesForIntegration,
  saveCookiesForIntegration,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import type { Cookie } from "crawlee";

/**
 * Сохраняет cookies в базу данных
 */
export async function saveCookies(
  integrationType: string,
  cookies: Cookie[],
  workspaceId: string,
): Promise<void> {
  try {
    await saveCookiesForIntegration(db, integrationType, cookies, workspaceId);
    console.log(`✓ Cookies сохранены для интеграции ${integrationType}`);
  } catch (error) {
    console.error("Ошибка при сохранении cookies:", error);
    throw error;
  }
}

/**
 * Загружает cookies из базы данных
 */
export async function loadCookies(
  integrationType: string,
  workspaceId: string,
): Promise<Cookie[] | null> {
  try {
    const cookies = await loadCookiesForIntegration(
      db,
      integrationType,
      workspaceId,
    );
    if (cookies) {
      console.log(
        `✓ Загружено ${cookies.length} cookies для ${integrationType}`,
      );
    } else {
      console.log(
        `Cookies не найдены для ${integrationType}, требуется авторизация`,
      );
    }
    return cookies;
  } catch (error) {
    console.error("Ошибка при загрузке cookies:", error);
    return null;
  }
}
