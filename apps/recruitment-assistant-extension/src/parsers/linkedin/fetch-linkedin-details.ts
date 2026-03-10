/**
 * Загрузка страниц LinkedIn details (experience, education, skills)
 * через фоновую вкладку — получаем полный DOM после рендеринга React.
 *
 * Вызывать из content script на linkedin.com.
 */

import { z } from "zod";
import type {
  ContactInfo,
  EducationEntry,
  ExperienceEntry,
} from "../../shared/types";
import {
  parseContactsFromContactInfoHtml,
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
  contactInfo: ContactInfo | null;
  /** Raw HTML overlay/contact-info для передачи в LLM */
  contactInfoHtml: string | null;
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

    const linkedInDetailsDataSchema = z.object({
      experienceHtml: z.string().optional(),
      educationHtml: z.string().optional(),
      skillsHtml: z.string().optional(),
      contactInfoHtml: z.string().optional(),
    });
    const parsed = linkedInDetailsDataSchema.safeParse(resp.data);
    const { experienceHtml, educationHtml, skillsHtml, contactInfoHtml } =
      parsed.success ? parsed.data : {};

    const result: LinkedInDetailsResult = {
      experience: [],
      education: [],
      skills: [],
      skillsHtml: null,
      contactInfo: null,
      contactInfoHtml: null,
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

    if (contactInfoHtml) {
      result.contactInfoHtml = contactInfoHtml;
      const contact = parseContactsFromContactInfoHtml(contactInfoHtml);
      if (contact) result.contactInfo = contact;
    }

    return result;
  } catch (err) {
    console.error("[fetchLinkedInDetails] Ошибка загрузки details:", err);
    return null;
  }
}
