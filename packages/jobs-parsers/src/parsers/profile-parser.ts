/**
 * Парсер профилей фриланс-платформ
 * Извлекает данные профиля по URL для использования в оценке откликов
 */

import type { StoredProfileData } from "@qbs-autonaim/db/schema";
import { scrapeKworkProfile } from "./kwork/profile-scraper";
import {
  URLSecurityError,
  validateSecureURLWithDNS,
} from "./utils/url-security";

export interface ProfileData {
  platform: "kwork" | "fl" | "freelance" | "unknown";
  username: string;
  profileUrl: string;
  aboutMe?: string;
  skills?: string[];
  statistics?: {
    rating?: number;
    ordersCompleted?: number;
    reviewsReceived?: number;
    successRate?: number;
    onTimeRate?: number;
    repeatOrdersRate?: number;
    buyerLevel?: string;
  };
  rawData?: string;
  parsedAt: Date;
  error?: string;
}

/**
 * Тип для структурированных данных профиля в БД
 * Re-exported from @qbs-autonaim/db for convenience
 */
export type { StoredProfileData } from "@qbs-autonaim/db/schema";

/**
 * Определяет платформу по URL профиля
 */
function detectPlatform(url: string): ProfileData["platform"] {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("kwork.ru")) return "kwork";
  if (urlLower.includes("fl.ru")) return "fl";
  if (urlLower.includes("freelance.ru")) return "freelance";

  return "unknown";
}

/**
 * Извлекает username из URL профиля
 */
function extractUsername(
  url: string,
  platform: ProfileData["platform"],
): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    switch (platform) {
      case "kwork":
        // https://kwork.ru/user/username
        return pathname.split("/user/")[1]?.split("/")[0] || "";
      case "fl":
        // https://fl.ru/users/username/
        return pathname.split("/users/")[1]?.split("/")[0] || "";
      case "freelance":
        // https://freelance.ru/users/username/
        return pathname.split("/users/")[1]?.split("/")[0] || "";
      default:
        return "";
    }
  } catch {
    return "";
  }
}

/**
 * Парсит профиль фрилансера по URL
 * Для kwork.ru извлекает "О себе" и навыки
 * Для других платформ пока только метаданные
 */
export async function parseFreelancerProfile(
  profileUrl: string,
): Promise<ProfileData> {
  // Валидация URL на безопасность (защита от SSRF и DNS rebinding)
  try {
    await validateSecureURLWithDNS(profileUrl, {
      allowedProtocols: ["https:"],
      allowPrivateIPs: false,
      allowLocalhostVariants: false,
    });
  } catch (error) {
    if (error instanceof URLSecurityError) {
      return {
        platform: "unknown",
        username: "",
        profileUrl,
        parsedAt: new Date(),
        error: `Небезопасный URL: ${error.message}`,
      };
    }
    throw error;
  }

  const platform = detectPlatform(profileUrl);
  const username = extractUsername(profileUrl, platform);

  if (!username) {
    return {
      platform,
      username: "",
      profileUrl,
      parsedAt: new Date(),
      error: "Не удалось извлечь username из URL",
    };
  }

  // Для kwork.ru делаем реальный парсинг
  if (platform === "kwork") {
    try {
      const kworkData = await scrapeKworkProfile(profileUrl);

      if (kworkData.error) {
        return {
          platform,
          username,
          profileUrl,
          parsedAt: new Date(),
          error: kworkData.error,
        };
      }

      return {
        platform,
        username,
        profileUrl,
        aboutMe: kworkData.aboutMe,
        skills: kworkData.skills,
        statistics: kworkData.statistics,
        parsedAt: new Date(),
      };
    } catch (error) {
      return {
        platform,
        username,
        profileUrl,
        parsedAt: new Date(),
        error:
          error instanceof Error ? error.message : "Ошибка парсинга профиля",
      };
    }
  }

  // Для остальных платформ пока только метаданные
  return {
    platform,
    username,
    profileUrl,
    parsedAt: new Date(),
  };
}

/**
 * Форматирует данные профиля для сохранения в БД
 * Возвращает структурированный объект для JSONB поля
 */
export function formatProfileDataForStorage(
  profile:
    | ProfileData
    | {
        platform: string;
        username: string;
        profileUrl: string;
        parsedAt: string | Date;
        aboutMe?: string;
        skills?: string[];
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
      },
): StoredProfileData {
  const parsedAt =
    profile.parsedAt instanceof Date
      ? profile.parsedAt.toISOString()
      : profile.parsedAt;

  return {
    platform: profile.platform,
    username: profile.username,
    profileUrl: profile.profileUrl,
    aboutMe: profile.aboutMe,
    skills: profile.skills,
    statistics: profile.statistics,
    parsedAt,
    error: profile.error,
  };
}
