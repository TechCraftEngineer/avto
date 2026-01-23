import type { GigResponse } from "../types";

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

interface UseGigResponseFlagsResult {
  hasInterviewScoring: boolean;
  hasConversation: boolean;
  hasProposal: boolean;
  hasPortfolio: boolean;
  hasExperience: boolean;
  hasContacts: boolean;
  hasReasoning: boolean;
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

export function useGigResponseFlags(
  response: GigResponse,
): UseGigResponseFlagsResult {
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

  // Gig-специфичные проверки
  const hasProposal = !!(
    response.proposedPrice ||
    response.proposedDeliveryDays ||
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

  // Проверяем наличие reasoning данных
  const hasReasoning =
    !!response.priceScoreReasoning ||
    !!response.deliveryScoreReasoning ||
    !!response.skillsMatchScoreReasoning ||
    !!response.experienceScoreReasoning ||
    !!response.compositeScoreReasoning;

  // Определяем дефолтный таб
  const getDefaultTab = () => {
    if (hasConversation) return "dialog";
    if (hasInterviewScoring) return "analysis";
    if (hasReasoning) return "explanation";
    if (hasProposal) return "proposal";
    if (hasExperience) return "experience";
    if (hasPortfolio) return "portfolio";
    if (hasContacts) return "contacts";
    return "proposal";
  };

  return {
    hasInterviewScoring,
    hasConversation,
    hasProposal,
    hasPortfolio,
    hasExperience,
    hasContacts,
    hasReasoning,
    conversation,
    getDefaultTab,
  };
}