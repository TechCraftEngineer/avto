/**
 * Типы для мультиагентной системы интервью
 */

/**
 * Базовый контекст для всех агентов
 */
export interface BaseAgentContext {
  candidateId?: string;
  conversationId?: string;
  conversationHistory: Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
    contentType?: "TEXT" | "VOICE";
    timestamp?: Date | string; // Поддержка Date и ISO string для гибкости
  }>;
  candidateName?: string;
  vacancyTitle?: string;
  vacancyDescription?: string;
  vacancyRequirements?: string;
  resumeData?: {
    experience?: string;
    coverLetter?: string;
    phone?: string;
    language?: string; // Язык резюме: "ru", "en", и т.д.
  };
  // Настройки бота
  botSettings?: {
    botName?: string;
    botRole?: string;
    companyName?: string;
    companyDescription?: string;
  };
  // Настройки вакансии
  customBotInstructions?: string | null;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null; // Технические вопросы
}

/**
 * Результат работы агента
 */
export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Типы агентов в системе
 */
export enum AgentType {
  ORCHESTRATOR = "orchestrator",
  SCREENER = "screener",
  INTERVIEWER = "interviewer",
  EVALUATOR = "evaluator",
  ESCALATION_DETECTOR = "escalation_detector",
  CONTEXT_ANALYZER = "context_analyzer",
  BOT_USAGE_DETECTOR = "bot_usage_detector",
  BOT_SUMMARY_ANALYZER = "bot_summary_analyzer",
  // Recruiter agent types
  CANDIDATE_SEARCH = "candidate_search",
  VACANCY_ANALYTICS = "vacancy_analytics",
  CONTENT_GENERATOR = "content_generator",
  COMMUNICATION = "communication",
  RULE_ENGINE = "rule_engine",
  INTENT_CLASSIFIER = "intent_classifier",
}

/**
 * Состояние workflow
 */
export interface WorkflowState {
  currentStage:
    | "AWAITING_PIN"
    | "PIN_RECEIVED"
    | "INTERVIEWING"
    | "COMPLETED"
    | "ESCALATED";
  voiceMessagesCount: number;
  questionsAsked: number;
  shouldContinue: boolean;
  escalationReason?: string;
  metadata: Record<string, unknown>;
}

/**
 * Решение агента
 */
export interface AgentDecision {
  action: "CONTINUE" | "ESCALATE" | "COMPLETE" | "SKIP";
  reason: string;
  nextStep?: string;
  confidence: number; // 0-1
}
