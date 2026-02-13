import type { PlatformSource } from "@qbs-autonaim/db/schema";

export interface ParsedPlatformLink {
  source: PlatformSource;
  externalId: string | null;
  url: string;
}

const PLATFORM_PATTERNS = {
  KWORK: {
    // Проекты (запросы покупателей): kwork.ru/project/123 или kwork.ru/projects?...
    // Кворки (услуги): kwork.ru/kwork/123
    pattern:
      /^https?:\/\/(?:www\.)?(?:kwork\.ru|kwork\.com)\/(?:project|kwork)\/(\d+)(?:\/.*)?$/,
    extractId: (url: string): string | null => {
      const match = url.match(
        /^https?:\/\/(?:www\.)?(?:kwork\.ru|kwork\.com)\/(?:project|kwork)\/(\d+)(?:\/.*)?$/,
      );
      return match ? (match[1] ?? null) : null;
    },
  },
  FL_RU: {
    pattern: /^https?:\/\/(?:www\.)?fl\.ru\/projects\/(\d+)(?:\/.*)?$/,
    extractId: (url: string): string | null => {
      const match = url.match(
        /^https?:\/\/(?:www\.)?fl\.ru\/projects\/(\d+)(?:\/.*)?$/,
      );
      return match ? (match[1] ?? null) : null;
    },
  },
  FREELANCE_RU: {
    pattern: /^https?:\/\/(?:www\.)?freelance\.ru\/project\/(\d+)(?:\/.*)?$/,
    extractId: (url: string): string | null => {
      const match = url.match(
        /^https?:\/\/(?:www\.)?freelance\.ru\/project\/(\d+)(?:\/.*)?$/,
      );
      return match ? (match[1] ?? null) : null;
    },
  },
  HABR: {
    pattern:
      /^https?:\/\/(?:www\.)?freelance\.habr\.com\/tasks\/(\d+)(?:\/.*)?$/,
    extractId: (url: string): string | null => {
      const match = url.match(
        /^https?:\/\/(?:www\.)?freelance\.habr\.com\/tasks\/(\d+)(?:\/.*)?$/,
      );
      return match ? (match[1] ?? null) : null;
    },
  },
};

/**
 * Парсер ссылок на фриланс-платформы
 * Автоматически определяет платформу и извлекает externalId из URL
 */

/**
 * Парсит ссылку на фриланс-платформу
 * @param url - URL ссылки на задание
 * @returns объект с распаршенными данными или null если не удалось распарсить
 */
export function parsePlatformLink(url: string): ParsedPlatformLink | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  // Нормализуем URL
  const normalizedUrl = url.trim();

  // Проверяем каждый паттерн платформы
  for (const [platform, config] of Object.entries(PLATFORM_PATTERNS)) {
    if (config.pattern.test(normalizedUrl)) {
      const externalId = config.extractId(normalizedUrl);
      if (externalId) {
        return {
          source: platform as PlatformSource,
          externalId,
          url: normalizedUrl,
        };
      }
    }
  }

  // Если не подошла ни одна платформа, но URL валидный - возвращаем как WEB_LINK
  try {
    new URL(normalizedUrl);
    return {
      source: "WEB_LINK",
      externalId: null,
      url: normalizedUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Получает URL для просмотра задания на платформе
 */
export function getPlatformTaskUrl(
  source: PlatformSource,
  externalId: string | null,
): string | null {
  if (!externalId) return null;

  const urlTemplates: Partial<Record<PlatformSource, string>> = {
    KWORK: `https://kwork.ru/project/${externalId}`,
    FL_RU: `https://fl.ru/projects/${externalId}`,
    FREELANCE_RU: `https://freelance.ru/project/${externalId}`,
    HABR: `https://freelance.habr.com/tasks/${externalId}`,
    HH: `https://hh.ru/vacancy/${externalId}`,
  };

  return urlTemplates[source] || null;
}
