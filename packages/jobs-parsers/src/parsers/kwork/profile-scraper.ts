/**
 * Парсер профилей kwork.ru
 * Извлекает информацию "О себе", навыки и статистику с публичной страницы профиля
 */

import { secureFetch } from "../utils/url-security";

export interface KworkProfileData {
  aboutMe?: string;
  skills: string[];
  statistics?: {
    rating?: number;
    ordersCompleted?: number;
    reviewsReceived?: number;
    successRate?: number;
    onTimeRate?: number;
    repeatOrdersRate?: number;
    buyerLevel?: string;
  };
  error?: string;
}

/**
 * Парсит профиль kwork.ru через fetch (без браузера)
 * Извлекает "О себе" и навыки из HTML
 */
export async function scrapeKworkProfile(
  profileUrl: string,
): Promise<KworkProfileData> {
  try {
    const response = await secureFetch(profileUrl, {
      timeout: 10000, // 10 секунд
      maxRedirects: 0, // Запрещаем редиректы
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      return {
        skills: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Парсим "О себе"
    const aboutMe = extractAboutMe(html);

    // Парсим навыки
    const skills = extractSkills(html);

    // Парсим статистику
    const statistics = extractStatistics(html);

    return {
      aboutMe,
      skills,
      statistics,
    };
  } catch (error) {
    console.error("Ошибка парсинга профиля kwork.ru:", error);
    return {
      skills: [],
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Извлекает текст "О себе" из HTML
 * Kwork.ru использует Vue.js и передает данные через window.stateData
 */
function extractAboutMe(html: string): string | undefined {
  // Ищем window.stateData в скрипте
  const stateDataMatch = html.match(/window\.stateData\s*=\s*({[\s\S]*?});/);

  if (!stateDataMatch?.[1]) {
    return undefined;
  }

  try {
    const stateData = JSON.parse(stateDataMatch[1]);

    if (!stateData.userProfileDescription) {
      return undefined;
    }

    // Очищаем HTML теги и декодируем HTML entities
    let text = stateData.userProfileDescription
      .replace(/<br\s*\/?>/gi, "\n") // Заменяем <br> на перенос строки
      .replace(/<[^>]+>/g, "") // Удаляем HTML теги
      .replace(/&nbsp;/g, " ") // Заменяем &nbsp; на пробел
      .replace(/&quot;/g, '"') // Заменяем &quot; на кавычки
      .replace(/&amp;/g, "&") // Заменяем &amp; на &
      .replace(/&lt;/g, "<") // Заменяем &lt; на <
      .replace(/&gt;/g, ">") // Заменяем &gt; на >
      .replace(/&mdash;/g, "—") // Заменяем &mdash; на тире
      .replace(/&laquo;/g, "«") // Заменяем &laquo; на «
      .replace(/&raquo;/g, "»") // Заменяем &raquo; на »
      .replace(/&bull;/g, "•") // Заменяем &bull; на •
      .replace(/&#(\d+);/g, (_: string, code: string) =>
        String.fromCharCode(Number(code)),
      ) // Декодируем числовые entities
      .trim();

    // Удаляем лишние пробелы, но сохраняем переносы строк
    text = text.replace(/ +/g, " ").replace(/\n +/g, "\n").trim();

    return text || undefined;
  } catch (error) {
    console.error("Ошибка парсинга stateData для aboutMe:", error);
    return undefined;
  }
}

/**
 * Извлекает навыки из HTML
 * Kwork.ru использует Vue.js и передает данные через window.stateData
 */
function extractSkills(html: string): string[] {
  // Ищем window.stateData в скрипте
  const stateDataMatch = html.match(/window\.stateData\s*=\s*({[\s\S]*?});/);

  if (!stateDataMatch?.[1]) {
    return [];
  }

  try {
    const stateData = JSON.parse(stateDataMatch[1]);

    if (!stateData.userSkills || !Array.isArray(stateData.userSkills)) {
      return [];
    }

    // Извлекаем названия навыков
    return stateData.userSkills
      .map((skill: { name?: string }) => skill.name?.trim())
      .filter((name: string | undefined): name is string => !!name);
  } catch (error) {
    console.error("Ошибка парсинга stateData для skills:", error);
    return [];
  }
}

/**
 * Извлекает статистику пользователя из HTML
 * Kwork.ru использует Vue.js и передает данные через window.stateData
 */
function extractStatistics(html: string): KworkProfileData["statistics"] {
  // Ищем window.stateData в скрипте
  const stateDataMatch = html.match(/window\.stateData\s*=\s*({[\s\S]*?});/);

  if (!stateDataMatch?.[1]) {
    return undefined;
  }

  try {
    const stateData = JSON.parse(stateDataMatch[1]);

    const statistics: NonNullable<KworkProfileData["statistics"]> = {};

    // Парсим рейтинг
    if (stateData.userRating) {
      statistics.rating = Number.parseFloat(stateData.userRating);
    }

    // Парсим количество выполненных заказов
    if (stateData.orderDoneCount) {
      statistics.ordersCompleted = Number.parseInt(
        stateData.orderDoneCount,
        10,
      );
    }

    // Парсим количество отзывов
    if (stateData.totalReviewsCount) {
      statistics.reviewsReceived = Number.parseInt(
        stateData.totalReviewsCount,
        10,
      );
    }

    // Парсим процент успешно сданных заказов
    if (stateData.orderDonePersent) {
      statistics.successRate = Number.parseInt(stateData.orderDonePersent, 10);
    }

    // Парсим процент заказов сданных вовремя
    if (stateData.orderDoneIntimePersent) {
      statistics.onTimeRate = Number.parseInt(
        stateData.orderDoneIntimePersent,
        10,
      );
    }

    // Парсим процент повторных заказов
    if (stateData.orderDoneRepeatPersent) {
      statistics.repeatOrdersRate = Number.parseInt(
        stateData.orderDoneRepeatPersent,
        10,
      );
    }

    // Парсим уровень покупателя
    if (stateData.payerLevelLabel) {
      statistics.buyerLevel = stateData.payerLevelLabel;
    }

    return Object.keys(statistics).length > 0 ? statistics : undefined;
  } catch (error) {
    console.error("Ошибка парсинга stateData:", error);
    return undefined;
  }
}
