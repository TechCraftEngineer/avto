import {
  loadCookiesForIntegration,
  saveCookiesForIntegration,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import type { CookieData } from "puppeteer";

/**
 * Сохраняет cookies в базу данных
 */
export async function saveCookies(
  integrationType: string,
  cookies: CookieData[],
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
): Promise<CookieData[] | null> {
  try {
    const cookies = await loadCookiesForIntegration(
      db,
      integrationType,
      workspaceId,
    );
    if (cookies) {
      // Фильтруем cookies с обязательным domain для puppeteer
      const validCookies = cookies.filter(
        (cookie): cookie is CookieData =>
          typeof cookie.domain === "string" && cookie.domain.length > 0,
      );

      if (validCookies.length > 0) {
        console.log(
          `✓ Загружено ${validCookies.length} cookies для ${integrationType}`,
        );
        return validCookies;
      }

      console.log(
        `Cookies не найдены для ${integrationType}, требуется авторизация`,
      );
      return null;
    }

    console.log(
      `Cookies не найдены для ${integrationType}, требуется авторизация`,
    );
    return null;
  } catch (error) {
    console.error("Ошибка при загрузке cookies:", error);
    return null;
  }
}
