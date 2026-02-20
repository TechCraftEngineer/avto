import type { StoredProfileData } from "../schema/types";

/**
 * Создает структурированный profileData для резюме HH.ru
 */
export function createResumeProfileData(data: {
  experience?: Array<{
    company?: string;
    position?: string;
    period?: string;
    description?: string;
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  languages?: Array<{
    name: string;
    level?: string;
  }>;
  skills?: string[];
  summary?: string;
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    telegram?: string;
    whatsapp?: string;
    location?: string;
    birthDate?: string;
    gender?: "male" | "female" | "other";
    citizenship?: string;
  };
}): StoredProfileData {
  return {
    experience: data.experience || [],
    education: data.education || [],
    languages: data.languages || [],
    skills: data.skills || [],
    summary: data.summary,
    personalInfo: data.personalInfo,
    parsedAt: new Date().toISOString(),
  };
}

/**
 * Обновляет существующий profileData, сохраняя все поля
 */
export function mergeProfileData(
  existing: StoredProfileData | null | undefined,
  updates: Partial<StoredProfileData>,
): StoredProfileData {
  const base = existing || {};
  return {
    ...base,
    ...updates,
  };
}

/**
 * Очищает временные поля из profileData
 */
export function cleanProfileData(
  data: Record<string, unknown>,
): StoredProfileData {
  const { resumeText, parsedResume, ...clean } = data;
  return clean as StoredProfileData;
}
