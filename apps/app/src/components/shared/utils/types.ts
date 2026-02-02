export interface ProfileData {
  error?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  experience?: string | null;
  education?: string | null;
  skills?: string[] | null;
  summary?: string | null;
  platform?: string | null;
  username?: string | null;
  profileUrl?: string | null;
  aboutMe?: string | null;
  statistics?: {
    rating?: number;
    ordersCompleted?: number;
    reviewsReceived?: number;
    successRate?: number;
    onTimeRate?: number;
    repeatOrdersRate?: number;
    buyerLevel?: string;
  } | null;
}

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

export interface ParsedProfileData {
  isJson: boolean;
  data: ProfileData | null;
  text: string | null;
}

export function getProfileData(
  profileData: unknown,
  fallbackExperience?: string | null,
): ParsedProfileData {
  // Пытаемся распарсить JSON из profileData
  if (profileData && typeof profileData === "string") {
    try {
      const parsed = JSON.parse(profileData) as ProfileData;
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
      data: profileData as ProfileData,
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
