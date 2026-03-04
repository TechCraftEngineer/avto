/**
 * Загрузка страниц LinkedIn details (experience, education, skills)
 * через фоновую вкладку — получаем полный DOM после рендеринга React.
 *
 * Вызывать из content script на linkedin.com.
 */

import type { EducationEntry, ExperienceEntry } from "../../shared/types";
import {
  parseEducations,
  parseExperiences,
  parseSkills,
  parseSkillsHtml,
} from "./parse-profile-dom";

export interface LinkedInDetailsResult {
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  skillsHtml: string | null;
}

/**
 * Извлекает username из URL профиля LinkedIn.
 * Поддерживает: /in/username/, /in/username, /in/username/details/...
 */
function getUsernameFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/in\/([^/]+)/);
  return match?.[1] ?? null;
}

/**
 * Загружает details-страницы LinkedIn через фоновую вкладку.
 * Возвращает данные из experience, education, skills или null при ошибке.
 */
export async function fetchLinkedInDetails(
  profilePathOrUrl: string = typeof window !== "undefined"
    ? window.location.pathname
    : "",
): Promise<LinkedInDetailsResult | null> {
  let pathname: string;
  try {
    pathname = profilePathOrUrl.startsWith("/")
      ? profilePathOrUrl
      : new URL(profilePathOrUrl, "https://linkedin.com").pathname;
  } catch {
    return null;
  }
  const username = getUsernameFromPath(pathname);
  if (!username) return null;

  try {
    const resp = await chrome.runtime.sendMessage({
      type: "FETCH_LINKEDIN_DETAILS",
      payload: { username },
    });

    if (!resp?.success || !resp.data) return null;

    const { experienceHtml, educationHtml, skillsHtml } = resp.data as {
      experienceHtml?: string;
      educationHtml?: string;
      skillsHtml?: string;
    };

    const result: LinkedInDetailsResult = {
      experience: [],
      education: [],
      skills: [],
      skillsHtml: null,
    };

    if (experienceHtml) {
      const doc = new DOMParser().parseFromString(
        `<body>${experienceHtml}</body>`,
        "text/html",
      );
      const parsed = parseExperiences(doc);
      if (parsed.length > 0) result.experience = parsed;
    }

    if (educationHtml) {
      const doc = new DOMParser().parseFromString(
        `<body>${educationHtml}</body>`,
        "text/html",
      );
      const parsed = parseEducations(doc);
      if (parsed.length > 0) result.education = parsed;
    }

    if (skillsHtml) {
      const doc = new DOMParser().parseFromString(
        `<body>${skillsHtml}</body>`,
        "text/html",
      );
      const skills = parseSkills(doc);
      if (skills.length > 0) result.skills = skills;
      result.skillsHtml = parseSkillsHtml(doc) ?? skillsHtml;
    }

    return result;
  } catch {
    return null;
  }
}
