/**
 * Типы для интервью агентов
 */

export interface WebInterviewContext {
  conversationId: string;
  candidateName?: string | null;
  vacancyTitle?: string | null;
  vacancyDescription?: string | null;
  conversationHistory: Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
    timestamp?: Date;
  }>;
  botSettings?: {
    botName?: string;
    botRole?: string;
    companyName?: string;
    companyDescription?: string;
  };
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null;
}

export interface InterviewVacancyData {
  title: string | null;
  description: string | null;
  region: string | null;
  customBotInstructions: string | null;
  customOrganizationalQuestions: string | null;
  customInterviewQuestions: string | null;
}

export interface GigData {
  title: string | null;
  description: string | null;
  type: string | null;
  budgetMin: number | null;
  budgetMax: number | null;

  estimatedDuration: string | null;
  deadline: Date | null;
  customBotInstructions: string | null;
  customOrganizationalQuestions: string | null;
  customInterviewQuestions: string | null;
}

export interface ContextAnalysisResult {
  messageType:
    | "ANSWER"
    | "QUESTION"
    | "ACKNOWLEDGMENT"
    | "OFF_TOPIC"
    | "CONTINUATION";
  requiresResponse: boolean;
  shouldEscalate: boolean;
  escalationReason?: string;
}
