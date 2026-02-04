import { hasExperience as checkExperience } from "@qbs-autonaim/shared/utils";
import type { VacancyResponse } from "../types";

// Type guard для проверки структуры interviewSession
function hasValidInterviewSession(session: unknown): session is {
  id: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string | null;
    type: "text" | "voice" | "file" | "event";
    voiceTranscription: string | null;
    createdAt: Date;
  }>;
} {
  if (!session || typeof session !== "object") return false;
  const s = session as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    Array.isArray(s.messages) &&
    s.messages.length > 0
  );
}

interface UseVacancyResponseFlagsResult {
  hasScreening: boolean;
  hasInterviewScoring: boolean;
  hasConversation: boolean;
  hasProposal: boolean;
  hasPortfolio: boolean;
  hasExperience: boolean;
  hasContacts: boolean;
  screening: {
    score: number;
    detailedScore: number;
    analysis: string | null;
    priceAnalysis?: string | null;
    deliveryAnalysis?: string | null;
  } | null;
  conversation: {
    id: string;
    status: string;
    messages: Array<{
      id: string;
      role: "user" | "assistant" | "system";
      content: string | null;
      type: "text" | "voice" | "file" | "event";
      voiceTranscription: string | null;
      createdAt: Date;
    }>;
  } | null;
  getDefaultTab: () => string;
}

export function useVacancyResponseFlags(
  response: VacancyResponse,
): UseVacancyResponseFlagsResult {
  // Screening специфично для vacancy
  const screening = response.screening;

  const hasScreening = !!screening;
  const hasInterviewScoring = !!response.interviewScoring;

  // Conversation из interviewSession
  let conversation: {
    id: string;
    status: string;
    messages: Array<{
      id: string;
      role: "user" | "assistant" | "system";
      content: string | null;
      type: "text" | "voice" | "file" | "event";
      voiceTranscription: string | null;
      createdAt: Date;
    }>;
  } | null = null;

  if (hasValidInterviewSession(response.interviewSession)) {
    conversation = {
      id: response.interviewSession.id,
      status: "completed",
      messages: response.interviewSession.messages,
    };
  }

  const hasConversation = !!conversation;

  // Vacancy-специфичные проверки
  const hasProposal = !!(
    response.salaryExpectationsAmount ||
    response.coverLetter ||
    response.salaryExpectationsComment
  );

  const hasPortfolio = !!(
    response.portfolioLinks?.length || response.portfolioFileId
  );

  const hasExperience = !!(
    checkExperience(response.profileData) ||
    response.skills?.length ||
    response.profileData
  );

  const hasContacts = !!(
    response.email ||
    response.phone ||
    response.telegramUsername
  );

  // Проверяем специфичные vacancy данные
  const hasSalaryData = !!response.salaryExpectationsAmount;

  // Определяем дефолтный таб
  const getDefaultTab = () => {
    if (hasConversation) return "dialog";
    if (hasScreening || hasInterviewScoring) return "analysis";
    if (hasSalaryData) return "salary"; // Приоритет зарплате для vacancy
    if (hasProposal) return "proposal";
    if (hasExperience) return "experience";
    if (hasPortfolio) return "portfolio";
    if (hasContacts) return "contacts";
    return "proposal";
  };

  return {
    hasScreening,
    hasInterviewScoring,
    hasConversation,
    hasProposal,
    hasPortfolio,
    hasExperience,
    hasContacts,
    screening,
    conversation,
    getDefaultTab,
  };
}
