import type { ExperienceItem, StoredProfileData } from "../schema/types";

/**
 * Извлекает опыт работы из profileData
 */
export function getExperienceFromProfile(
  profileData: StoredProfileData | null | undefined,
): ExperienceItem[] {
  if (!profileData?.experience) return [];
  return profileData.experience;
}

/**
 * Форматирует опыт работы в текстовую строку для отображения
 */
export function formatExperienceText(
  profileData: StoredProfileData | null | undefined,
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
  profileData: StoredProfileData | null | undefined,
): boolean {
  return getExperienceFromProfile(profileData).length > 0;
}
