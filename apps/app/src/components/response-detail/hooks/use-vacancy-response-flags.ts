import type { RouterOutputs } from "@qbs-autonaim/api";

type GigResponseDetail = NonNullable<RouterOutputs["gig"]["responses"]["get"]>;
type VacancyResponseDetail = NonNullable<
  RouterOutputs["vacancy"]["responses"]["get"]
>;

export type ResponseDetail = (GigResponseDetail | VacancyResponseDetail) & {
  globalCandidate?: null;
};

// Type guard для проверки типа отклика
export function isVacancyResponse(
  response: GigResponseDetail | VacancyResponseDetail,
): response is VacancyResponseDetail {
  return "salaryExpectationsAmount" in response;
}

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

// Type guard для проверки структуры conversation
function _hasValidConversation(conversation: unknown): conversation is {
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
} {
  if (!conversation || typeof conversation !== "object") return false;
  const c = conversation as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    Array.isArray(c.messages) &&
    c.messages.length > 0
  );
}

interface UseVacancyResponseFlagsResult {
  isVacancy: boolean;
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
  response: ResponseDetail,
): UseVacancyResponseFlagsResult {
  const isVacancy = isVacancyResponse(response);

  // Определяем screening в зависимости от типа отклика
  const screening = isVacancy
    ? response.screening
    : ((
        response.interviewSession as {
          scoring?: {
            score: number;
            detailedScore: number;
            analysis: string | null;
            priceAnalysis?: string | null;
            deliveryAnalysis?: string | null;
          } | null;
        } | null
      )?.scoring ?? null);

  const hasScreening = !!screening;
  const hasInterviewScoring = !!response.interviewScoring;

  // Определяем conversation в зависимости от типа отклика
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

  if (isVacancy) {
    // Для vacancy создаем conversation из interviewSession
    if (hasValidInterviewSession(response.interviewSession)) {
      conversation = {
        id: response.interviewSession.id,
        status: "completed",
        messages: response.interviewSession.messages,
      };
    }
  } else {
    // Для gig также используем interviewSession
    if (hasValidInterviewSession(response.interviewSession)) {
      conversation = {
        id: response.interviewSession.id,
        status: "completed",
        messages: response.interviewSession.messages,
      };
    }
  }

  const hasConversation = !!conversation;

  // Определяем, какие табы показывать
  const hasProposal = isVacancy
    ? !!(
        response.salaryExpectationsAmount ||
        response.coverLetter ||
        (isVacancyResponse(response)
          ? response.salaryExpectationsComment
          : undefined)
      )
    : !!(
        (!isVacancyResponse(response)
          ? (response as GigResponseDetail).proposedPrice
          : undefined) ||
        (!isVacancyResponse(response)
          ? (response as GigResponseDetail).proposedDeliveryDays
          : undefined) ||
        response.coverLetter
      );

  const hasPortfolio = !!(
    response.portfolioLinks?.length || response.portfolioFileId
  );

  const hasExperience = !!(
    response.experience ||
    response.skills?.length ||
    response.profileData
  );

  const hasContacts = !!(
    response.email ||
    response.phone ||
    response.telegramUsername
  );

  // Определяем дефолтный таб
  const getDefaultTab = () => {
    if (hasConversation) return "dialog";
    if (hasScreening || hasInterviewScoring) return "analysis";
    if (hasProposal) return "proposal";
    if (hasExperience) return "experience";
    if (hasPortfolio) return "portfolio";
    if (hasContacts) return "contacts";
    return "proposal";
  };

  return {
    isVacancy,
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
