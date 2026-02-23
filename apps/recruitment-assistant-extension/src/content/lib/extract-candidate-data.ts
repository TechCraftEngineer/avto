/**
 * Извлечение данных кандидата с платформы.
 * Обрабатывает частичное извлечение при ошибках (Требование 11.3).
 */

import type { PlatformAdapter } from "../../adapters/base/platform-adapter";
import { DataExtractor } from "../../core/data-extractor";
import type { CandidateData } from "../../shared/types";

const DEFAULT_CANDIDATE_DATA: Omit<
  CandidateData,
  "platform" | "profileUrl" | "extractedAt"
> = {
  basicInfo: {
    fullName: "",
    currentPosition: "",
    location: "",
    photoUrl: null,
  },
  experience: [],
  education: [],
  skills: [],
  contacts: {
    email: null,
    phone: null,
    socialLinks: [],
  },
};

/** Пытается извлечь частичные данные через адаптер при сбое основного извлечения */
function extractPartialData(adapter: PlatformAdapter): CandidateData | null {
  const partialData: Partial<CandidateData> = {
    platform: adapter.platformName,
    profileUrl: window.location.href,
    extractedAt: new Date(),
  };

  try {
    partialData.basicInfo = adapter.extractBasicInfo();
  } catch {
    // игнорируем
  }
  try {
    partialData.experience = adapter.extractExperience();
  } catch {
    // игнорируем
  }
  try {
    partialData.education = adapter.extractEducation();
  } catch {
    // игнорируем
  }
  try {
    partialData.skills = adapter.extractSkills();
  } catch {
    // игнорируем
  }
  try {
    partialData.contacts = adapter.extractContacts();
  } catch {
    // игнорируем
  }

  const hasAny =
    partialData.basicInfo ||
    (partialData.experience?.length ?? 0) > 0 ||
    (partialData.education?.length ?? 0) > 0 ||
    (partialData.skills?.length ?? 0) > 0 ||
    partialData.contacts;

  if (!hasAny) return null;

  return {
    ...DEFAULT_CANDIDATE_DATA,
    platform: partialData.platform ?? "Unknown",
    profileUrl: partialData.profileUrl ?? window.location.href,
    basicInfo: partialData.basicInfo ?? DEFAULT_CANDIDATE_DATA.basicInfo,
    experience: partialData.experience ?? [],
    education: partialData.education ?? [],
    skills: partialData.skills ?? [],
    contacts: partialData.contacts ?? DEFAULT_CANDIDATE_DATA.contacts,
    extractedAt: partialData.extractedAt ?? new Date(),
  };
}

/**
 * Извлекает данные профиля.
 * При ошибке DataExtractor пытается получить частичные данные через адаптер.
 */
export async function extractCandidateData(
  adapter: PlatformAdapter | null,
): Promise<CandidateData | null> {
  try {
    const extractor = new DataExtractor();
    return await extractor.extract();
  } catch (error) {
    if (adapter) {
      const partial = extractPartialData(adapter);
      if (partial) return partial;
    }
    throw error;
  }
}
