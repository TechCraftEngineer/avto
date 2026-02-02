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
}

export interface RecommendationData {
  score: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  recommendation: "hire" | "maybe" | "pass";
}

export function getProfileData(data: unknown): ProfileData | null {
  if (!data || typeof data !== "object") return null;

  return data as ProfileData;
}
