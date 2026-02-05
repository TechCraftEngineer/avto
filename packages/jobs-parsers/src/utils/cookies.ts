import {
  loadCookiesForIntegration,
  saveCookiesForIntegration,
  type Cookie,
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
    // Преобразуем CookieData в Cookie, обеспечивая совместимость типов
    const dbCookies: Cookie[] = cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as Cookie["sameSite"],
    }));
    await saveCookiesForIntegration(db, integrationType, dbCookies, workspaceId);
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
      // Фильтруем cookies с обязательным domain для puppeteer и преобразуем в CookieData
      const validCookies: CookieData[] = cookies
        .filter(
          (cookie): cookie is Cookie & { domain: string } =>
            typeof cookie.domain === "string" && cookie.domain.length > 0,
        )
        .map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expires,
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite as CookieData["sameSite"],
        }));

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
