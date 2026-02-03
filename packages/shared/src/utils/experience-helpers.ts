/**
 * Вспомогательные функции для работы с опытом работы из profileData
 */

interface ExperienceItem {
  company?: string;
  position?: string;
  period?: string;
  description?: string;
  experience?: {
    company?: string;
    position?: string;
    period?: string;
    description?: string;
  };
}

interface ProfileData {
  experience?: ExperienceItem[];
  education?: unknown[];
  languages?: unknown[];
  summary?: string;
  [key: string]: unknown;
}

/**
 * Извлекает опыт работы из profileData
 */
export function getExperienceFromProfile(
  profileData: ProfileData | Record<string, unknown> | null | undefined,
): ExperienceItem[] {
  if (!profileData || typeof profileData !== "object") return [];

  const experience = (profileData as ProfileData).experience;
  if (!Array.isArray(experience)) return [];

  return experience;
}

/**
 * Форматирует опыт работы в текстовую строку для отображения
 */
export function formatExperienceText(
  profileData: ProfileData | Record<string, unknown> | null | undefined,
): string {
  const experience = getExperienceFromProfile(profileData);
  if (experience.length === 0) return "";

  return experience
    .map((item) => {
      const exp = item.experience || item;
      const parts: string[] = [];

      if (exp.position) parts.push(exp.position);
      if (exp.company) parts.push(`в ${exp.company}`);
      if (exp.period) parts.push(`(${exp.period})`);
      if (exp.description) parts.push(`\n${exp.description}`);

      return parts.join(" ");
    })
    .join("\n\n");
}

/**
 * Проверяет, есть ли опыт работы в profileData
 */
export function hasExperience(
  profileData: ProfileData | Record<string, unknown> | null | undefined,
): boolean {
  return getExperienceFromProfile(profileData).length > 0;
}

/**
 * Получает краткое описание опыта (первые N символов)
 */
export function getExperienceSummary(
  profileData: ProfileData | Record<string, unknown> | null | undefined,
  maxLength = 120,
): string {
  const text = formatExperienceText(profileData);
  if (!text) return "";

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
