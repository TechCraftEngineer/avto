import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancyPublication } from "@qbs-autonaim/db/schema";
import { checkPublicationStatusChannel } from "../../channels/client";
import { inngest } from "../../client";

/**
 * Inngest функция для проверки статуса публикации вакансии на внешней платформе
 * Проверяет, существует ли публикация на платформе и обновляет статус isActive
 */
export const checkPublicationStatusFunction = inngest.createFunction(
  {
    id: "check-publication-status",
    name: "Check Publication Status",
    retries: 2,
    concurrency: 5, // Разрешаем параллельную проверку нескольких публикаций
  },
  { event: "vacancy/publication.status.check" },
  async ({ event, step, publish }) => {
    const { publicationId } = event.data;

    await publish(
      checkPublicationStatusChannel(publicationId).status({
        status: "started",
        message: "Начинаем проверку статуса публикации",
        publicationId,
      }),
    );

    const result = await step.run("check-publication-status", async () => {
      console.log(`🚀 Запуск проверки статуса публикации ${publicationId}`);

      // Получаем данные публикации
      const publication = await db.query.vacancyPublication.findFirst({
        where: eq(vacancyPublication.id, publicationId),
        with: {
          vacancy: {
            columns: {
              workspaceId: true,
            },
          },
        },
      });

      if (!publication) {
        await publish(
          checkPublicationStatusChannel(publicationId).status({
            status: "error",
            message: `Публикация ${publicationId} не найдена`,
            publicationId,
          }),
        );
        throw new Error(`Публикация ${publicationId} не найдена`);
      }

      try {
        await publish(
          checkPublicationStatusChannel(publicationId).status({
            status: "processing",
            message: `Проверяем статус на платформе ${publication.platform}`,
            publicationId,
          }),
        );

        // Проверяем статус на соответствующей платформе
        const isActive = await checkPlatformPublicationStatus(publication);

        // Обновляем статус публикации
        const [_updatedPublication] = await db
          .update(vacancyPublication)
          .set({
            isActive,
            lastCheckedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(vacancyPublication.id, publicationId))
          .returning();

        const statusMessage = isActive
          ? "Публикация активна на платформе"
          : "Публикация не найдена или неактивна на платформе";

        await publish(
          checkPublicationStatusChannel(publicationId).status({
            status: "completed",
            message: statusMessage,
            publicationId,
            isActive,
          }),
        );

        console.log(
          `✅ Статус публикации ${publicationId} проверен: ${isActive ? "активна" : "неактивна"}`,
        );

        return {
          success: true,
          publicationId,
          platform: publication.platform,
          isActive,
          previousStatus: publication.isActive,
        };
      } catch (error) {
        console.error(
          `❌ Ошибка при проверке статуса публикации ${publicationId}:`,
          error,
        );
        await publish(
          checkPublicationStatusChannel(publicationId).status({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Неизвестная ошибка при проверке статуса",
            publicationId,
          }),
        );
        throw error;
      }
    });

    return result;
  },
);

/**
 * Проверяет статус публикации на соответствующей платформе
 */
async function checkPlatformPublicationStatus(
  publication: typeof vacancyPublication.$inferSelect & {
    vacancy: { workspaceId: string };
  },
): Promise<boolean> {
  const { platform, externalId, url } = publication;

  switch (platform) {
    case "HH":
      return await checkHHVacancyStatus(externalId, url);
    case "AVITO":
      return await checkAvitoVacancyStatus(externalId, url);
    case "SUPERJOB":
      return await checkSuperJobVacancyStatus(externalId, url);
    case "HABR":
      return await checkHabrVacancyStatus(externalId, url);
    case "TELEGRAM":
      return await checkTelegramChannelStatus(externalId, url);
    default:
      console.warn(`Неизвестная платформа: ${platform}`);
      return false;
  }
}

/**
 * Validates URL for SSRF protection
 */
function validateUrlForPlatform(
  url: string,
  allowedHostnames: string[],
): boolean {
  try {
    const urlObj = new URL(url);
    // Only allow HTTP/HTTPS schemes
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      console.error(
        `❌ Invalid URL scheme: ${urlObj.protocol} for URL: ${url}`,
      );
      return false;
    }
    // Check hostname against allowlist
    const isAllowedHostname = allowedHostnames.some(
      (allowed) =>
        urlObj.hostname === allowed || urlObj.hostname.endsWith(`.${allowed}`),
    );
    if (!isAllowedHostname) {
      console.error(
        `❌ Invalid hostname: ${urlObj.hostname} not in allowlist ${allowedHostnames.join(", ")} for URL: ${url}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(`❌ Invalid URL format: ${url}`, error);
    return false;
  }
}

/**
 * Проверяет статус вакансии на HH.ru
 */
async function checkHHVacancyStatus(
  externalId: string | null,
  url: string | null,
): Promise<boolean> {
  try {
    if (!externalId && !url) return false;

    let vacancyUrl: string;

    // Prefer building URL from externalId for security
    if (externalId) {
      vacancyUrl = `https://hh.ru/vacancy/${externalId}`;
    } else if (url) {
      // Validate provided URL to prevent SSRF attacks
      if (!validateUrlForPlatform(url, ["hh.ru", "hhcdn.ru"])) {
        return false;
      }
      vacancyUrl = url;
    } else {
      return false;
    }

    const response = await fetch(vacancyUrl, {
      method: "HEAD", // Используем HEAD для проверки доступности
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // Сначала проверяем перенаправления, так как некоторые редиректы могут возвращать 200
    if (response.redirected) {
      const finalUrl = response.url;
      if (
        finalUrl.includes("/search/vacancy") ||
        finalUrl === "https://hh.ru/"
      ) {
        return false;
      }
    }

    // Если статус 200 и не было проблемных перенаправлений, вакансия существует
    if (response.status === 200) {
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Ошибка при проверке HH вакансии ${externalId}:`, error);
    return false;
  }
}

/**
 * Проверяет статус вакансии на Avito
 */
async function checkAvitoVacancyStatus(
  _externalId: string | null,
  url: string | null,
): Promise<boolean> {
  try {
    if (!url) return false;

    // Validate URL to prevent SSRF attacks
    if (!validateUrlForPlatform(url, ["avito.ru"])) {
      return false;
    }

    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    return response.status === 200;
  } catch (error) {
    console.error(`Ошибка при проверке Avito вакансии:`, error);
    return false;
  }
}

/**
 * Проверяет статус вакансии на SuperJob
 */
async function checkSuperJobVacancyStatus(
  _externalId: string | null,
  url: string | null,
): Promise<boolean> {
  try {
    if (!url) return false;

    // Validate URL to prevent SSRF attacks
    if (!validateUrlForPlatform(url, ["superjob.ru"])) {
      return false;
    }

    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    return response.status === 200;
  } catch (error) {
    console.error(`Ошибка при проверке SuperJob вакансии:`, error);
    return false;
  }
}

/**
 * Проверяет статус вакансии на Habr Career
 */
async function checkHabrVacancyStatus(
  _externalId: string | null,
  url: string | null,
): Promise<boolean> {
  try {
    if (!url) return false;

    // Validate URL to prevent SSRF attacks
    if (!validateUrlForPlatform(url, ["career.habr.com"])) {
      return false;
    }

    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    return response.status === 200;
  } catch (error) {
    console.error(`Ошибка при проверке Habr вакансии:`, error);
    return false;
  }
}

/**
 * Проверяет статус канала в Telegram
 * Для Telegram проверяем, что канал существует и доступен
 */
async function checkTelegramChannelStatus(
  externalId: string | null,
  url: string | null,
): Promise<boolean> {
  try {
    if (!url && !externalId) return false;

    // Для Telegram используем публичное API для проверки канала
    const channelName = externalId || extractTelegramChannelName(url);
    if (!channelName) return false;

    // Используем Telegram API для проверки существования канала
    const apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getChat?chat_id=@${channelName}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    return data.ok === true;
  } catch (error) {
    console.error(`Ошибка при проверке Telegram канала:`, error);
    return false;
  }
}

/**
 * Извлекает имя канала из URL Telegram
 */
function extractTelegramChannelName(url: string | null): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "t.me") {
      return urlObj.pathname.slice(1); // Убираем ведущий слэш
    }
  } catch {
    // Если URL невалидный, пробуем извлечь из строки
    const match = url.match(/t\.me\/([a-zA-Z0-9_]+)/);
    return match ? match[1] || null : null;
  }

  return null;
}
