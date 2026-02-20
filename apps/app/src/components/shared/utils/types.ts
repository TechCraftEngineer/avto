import type {
  ExperienceItem,
  EducationItem,
  PersonalInfo,
} from "@qbs-autonaim/db/schema";
import type {
  ExtendedProfileData,
  ParsedProfileData,
} from "@qbs-autonaim/shared/types";

export type { ExperienceItem, EducationItem, PersonalInfo };

export interface RecommendationData {
  score: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  recommendation:
    | "hire"
    | "maybe"
    | "pass"
    | "HIGHLY_RECOMMENDED"
    | "RECOMMENDED"
    | "NEUTRAL"
    | "NOT_RECOMMENDED";
  candidateSummary?: string;
  weaknesses?: string[];
  riskFactors?: Array<{ severity: string; description: string }>;
  interviewQuestions?: string[];
  actionSuggestions?: string[];
}

export function getProfileData(
  profileData: unknown,
  fallbackExperience?: string | null,
): ParsedProfileData {
  // Пытаемся распарсить JSON из profileData
  if (profileData && typeof profileData === "string") {
    try {
      const parsed = JSON.parse(profileData) as ExtendedProfileData;
      return {
        isJson: true,
        data: parsed,
        text: null,
      };
    } catch {
      // Не JSON, используем как текст
      return {
        isJson: false,
        data: null,
        text: profileData,
      };
    }
  }

  if (profileData && typeof profileData === "object") {
    return {
      isJson: true,
      data: profileData as ExtendedProfileData,
      text: null,
    };
  }

  // Используем fallback experience как текст
  if (fallbackExperience) {
    return {
      isJson: false,
      data: null,
      text: fallbackExperience,
    };
  }

  return {
    isJson: false,
    data: null,
    text: null,
  };
}
