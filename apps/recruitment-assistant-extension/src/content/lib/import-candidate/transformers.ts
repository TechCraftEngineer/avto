/**
 * Преобразование данных кандидата для импорта
 */

import type {
  CandidateData,
  EducationEntry,
  ExperienceEntry,
} from "../../../shared/types";
import type { ValidPlatformSource } from "./platform";

/** Извлекает username Telegram из socialLinks (t.me/xxx, telegram.me/xxx) */
export function extractTelegramFromSocialLinks(
  socialLinks?: string[] | null,
): string | undefined {
  if (!socialLinks?.length) return undefined;
  const telegramHosts = ["t.me", "telegram.me"];
  const usernamePattern = /^\/?(?:dg\/)?([a-zA-Z0-9_]{4,32})(?:[/?#]|$)/;
  for (const link of socialLinks) {
    try {
      const trimmed = link.trim();
      const normalizedLink =
        !trimmed.includes("://") && /^(t\.me|telegram\.me)(\/|$)/i.test(trimmed)
          ? `https://${trimmed}`
          : trimmed;
      const u = new URL(normalizedLink);
      const host = u.hostname.toLowerCase().replace(/^www\./, "");
      if (!telegramHosts.includes(host)) continue;
      const match = u.pathname.match(usernamePattern);
      if (match?.[1]) return match[1];
    } catch {
      // Not a valid URL, skip
    }
  }
  return undefined;
}

export interface ProfileDataForImport {
  platform?: string;
  profileUrl?: string;
  aboutMe?: string;
  skills?: string[];
  experience?: Array<{
    company?: string;
    position?: string;
    period?: string;
    description?: string;
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    period?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  parsedAt: string;
}

/** Преобразует данные расширения в profileData для import-resume */
export function buildProfileDataForImport(
  data: CandidateData,
  profileUrl: string | undefined,
  aboutMe?: string,
): ProfileDataForImport {
  const mapExp = (e: ExperienceEntry) => {
    const start =
      e.startDate instanceof Date
        ? e.startDate.toISOString().slice(0, 7)
        : e.startDate;
    const end =
      e.endDate instanceof Date
        ? e.endDate.toISOString().slice(0, 7)
        : e.endDate;
    const period = [start, end].filter(Boolean).join(" — ") || undefined;
    return {
      company: e.company ?? undefined,
      position: e.position,
      period,
      description: e.description ?? undefined,
    };
  };
  const mapEdu = (e: EducationEntry) => {
    const start = e.startDate;
    const end = e.endDate;
    const period = [start, end].filter(Boolean).join(" — ") || undefined;
    return {
      institution: e.institution,
      degree: e.degree ?? undefined,
      period,
      field: e.field ?? e.fieldOfStudy ?? undefined,
      startDate: e.startDate,
      endDate: e.endDate,
    };
  };
  return {
    platform: data.platform,
    profileUrl,
    aboutMe: aboutMe || undefined,
    skills: data.skills?.length ? data.skills : undefined,
    experience: data.experience?.length
      ? data.experience.map(mapExp)
      : undefined,
    education: data.education?.length ? data.education.map(mapEdu) : undefined,
    parsedAt: new Date().toISOString(),
  };
}

const PLACEHOLDER_PATTERNS = [
  /^load\s+more$/i,
  /^show\s+more$/i,
  /^see\s+more$/i,
  /^more\s+results$/i,
  /^view\s+more$/i,
];

/** Проверяет, что строка содержит осмысленный контент (не только bullet + пробелы и не placeholder) */
function hasMeaningfulContent(line: string): boolean {
  const trimmed = line.replace(/^•\s*/, "").trim();
  if (trimmed.length === 0) return false;
  return !PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

/** Формирует responseText для импорта (краткое резюме для отображения).
 * Не добавляет секции Опыт/Образование, если в них только пустые bullet'ы.
 */
export function buildResponseText(
  data: CandidateData,
  rawSource: ValidPlatformSource | string,
): string {
  const isLinkedIn = String(rawSource).toUpperCase() === "LINKEDIN";
  const fallback = isLinkedIn
    ? "Импортировано из LinkedIn"
    : "Импортировано из расширения";
  const parts: string[] = [];
  if (data.basicInfo.currentPosition)
    parts.push(data.basicInfo.currentPosition);
  if (data.basicInfo.location)
    parts.push(`Локация: ${data.basicInfo.location}`);
  if (data.skills?.length) parts.push(`Навыки: ${data.skills.join(", ")}`);
  if (isLinkedIn && data.experience?.length) {
    const expLines = data.experience
      .map((e) => {
        const duration =
          e.startDate || e.endDate
            ? [e.startDate, e.endDate].filter(Boolean).join(" — ")
            : "";
        return `• ${e.position ?? ""}${e.company ? ` в ${e.company}` : ""}${duration ? ` (${duration})` : ""}`;
      })
      .filter(hasMeaningfulContent);
    if (expLines.length > 0) parts.push(`Опыт:\n${expLines.join("\n")}`);
  }
  if (isLinkedIn && data.education?.length) {
    const eduLines = data.education
      .map((e) => {
        const years =
          e.startDate || e.endDate
            ? [e.startDate, e.endDate].filter(Boolean).join(" — ")
            : "";
        return `• ${e.institution ?? ""}${e.degree ? `, ${e.degree}` : ""}${years ? ` (${years})` : ""}`;
      })
      .filter(hasMeaningfulContent);
    if (eduLines.length > 0) parts.push(`Образование:\n${eduLines.join("\n")}`);
  }
  const result = parts.filter(Boolean).join("\n\n");
  return result.trim().length > 0 ? result : fallback;
}
