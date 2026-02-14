/**
 * Получение откликов проекта Kwork через веб с кэшированием cookies.
 * Использует сохранённые cookies из БД; при просрочке выполняет переавторизацию.
 */
import type { DbClient } from "@qbs-autonaim/db";
import {
  getIntegration,
  KWORK_WEB_COOKIES_SAVED_AT_KEY,
  KWORK_WEB_COOKIES_TTL_SEC,
  saveCookiesForIntegration,
} from "@qbs-autonaim/db";
import {
  cookiesToHeaderString,
  getProjectOffersFromWeb,
  type WebParsedOffer,
} from "@qbs-autonaim/integration-clients/server";
import { executeWithKworkTokenRefresh } from "./kwork-token-refresh";

export interface GetProjectOffersResult {
  success: boolean;
  offers?: WebParsedOffer[];
  errorMessage?: string;
}

function isAuthRequiredError(result: {
  success: boolean;
  errorMessage?: string;
}): boolean {
  if (!result.success && result.errorMessage) {
    const msg = result.errorMessage.toLowerCase();
    return (
      msg.includes("авторизация") ||
      msg.includes("контейнер откликов не найден")
    );
  }
  return false;
}

function useCachedCookies(savedAt: number | undefined): boolean {
  if (savedAt == null) return false;
  const now = Math.floor(Date.now() / 1000);
  return now < savedAt + KWORK_WEB_COOKIES_TTL_SEC;
}

/**
 * Получить отклики проекта Kwork через веб.
 * Использует сохранённые cookies; при просрочке или ошибке авторизации — переавторизация.
 */
export async function getProjectOffersFromWebWithCache(
  db: DbClient,
  workspaceId: string,
  projectId: number,
): Promise<GetProjectOffersResult> {
  const result = await executeWithKworkTokenRefresh(
    db,
    workspaceId,
    async (api, token) => {
      const integration = await getIntegration(db, "kwork", workspaceId);

      const metadata = (integration?.metadata ?? {}) as Record<string, unknown>;
      const savedAt = metadata[KWORK_WEB_COOKIES_SAVED_AT_KEY] as
        | number
        | undefined;

      let cookieHeader: string | undefined;
      if (useCachedCookies(savedAt) && integration?.cookies?.length) {
        cookieHeader = cookiesToHeaderString(integration.cookies);
      }

      const firstResult = await getProjectOffersFromWeb(api, token, projectId, {
        cookieHeader,
      });

      if (
        firstResult.success &&
        firstResult.offers &&
        !firstResult.errorMessage
      ) {
        return { success: true, response: { offers: firstResult.offers } };
      }

      if (
        firstResult.success &&
        Array.isArray(firstResult.offers) &&
        firstResult.offers.length === 0 &&
        !firstResult.errorMessage
      ) {
        return { success: true, response: { offers: [] } };
      }

      if (isAuthRequiredError(firstResult) || !cookieHeader) {
        const retryResult = await getProjectOffersFromWeb(
          api,
          token,
          projectId,
        );

        if (retryResult.webCookies?.length) {
          await saveCookiesForIntegration(
            db,
            "kwork",
            retryResult.webCookies,
            workspaceId,
            { [KWORK_WEB_COOKIES_SAVED_AT_KEY]: Math.floor(Date.now() / 1000) },
          );
        }

        if (retryResult.success) {
          return {
            success: true,
            response: { offers: retryResult.offers ?? [] },
          };
        }

        return {
          success: false,
          error: {
            message: retryResult.errorMessage ?? "Не удалось получить отклики",
          },
        };
      }

      return {
        success: false,
        error: {
          message: firstResult.errorMessage ?? "Не удалось получить отклики",
        },
      };
    },
  );

  if (result.success && result.response) {
    const offers = (result.response as { offers?: WebParsedOffer[] }).offers;
    return {
      success: true,
      offers: offers ?? [],
    };
  }

  return {
    success: false,
    errorMessage: (result as { error?: { message?: string } }).error?.message,
  };
}
