/**
 * Типы для AI-ассистента рекрутера
 */

import type { BaseAgentContext } from "../../core/types";

/**
 * Намерения пользователя для Intent Classifier
 */
export type RecruiterIntent =
  | "SEARCH_CANDIDATES"
  | "ANALYZE_VACANCY"
  | "GENERATE_CONTENT"
  | "COMMUNICATE"
  | "CONFIGURE_RULES"
  | "GET_PRIORITY"
  | "GET_INTERVIEW_QUESTIONS"
  | "GENERAL_QUESTION";

/**
 * Сообщение в истории диалога
 */
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: RecruiterIntent;
    actions?: string[];
  };
}

/**
 * Настройки компании для рекрутера
 */
export interface RecruiterCompanySettings {
  botName?: string;
  botRole?: string;
  name?: string;
  description?: string;
  communicationStyle?: "formal" | "casual" | "professional";
  defaultAutonomyLevel?: "advise" | "confirm" | "autonomous";
}

/**
 * Контекст диалога рекрутера
 */
export interface RecruiterConversationContext {
  workspaceId: string;
  userId: string;
  currentVacancyId?: string;
  conversationHistory: ConversationMessage[];
  companySettings: RecruiterCompanySettings;
  recentDecisions: RecruiterDecision[];
  /** История feedback для влияния на рекомендации */
  feedbackHistory?: RecruiterFeedbackHistory;
}

/**
 * Решение рекрутера (для обучения)
 */
export interface RecruiterDecision {
  id: string;
  type: "accept" | "reject" | "modify";
  originalRecommendation: string;
  userAction?: string;
  timestamp: Date;
}

/**
 * Запись feedback от рекрутера
 */
export interface RecruiterFeedbackEntry {
  id: string;
  feedbackType: "accepted" | "rejected" | "modified" | "error_report";
  originalRecommendation: string | null;
  userAction: string | null;
  reason: string | null;
  createdAt: Date;
}

/**
 * Статистика feedback пользователя
 */
export interface RecruiterFeedbackStats {
  total: number;
  accepted: number;
  rejected: number;
  modified: number;
  acceptanceRate: number;
  rejectionRate: number;
}

/**
 * История feedback для влияния на рекомендации
 */
export interface RecruiterFeedbackHistory {
  entries: RecruiterFeedbackEntry[];
  stats: RecruiterFeedbackStats;
}

/**
 * Контекст отклика для режима интервью (подгружается API при наличии responseId)
 */
export interface ResponseInterviewContext {
  responseId: string;
  candidateId: string;
  vacancyId: string;
  candidateData: {
    resume?: string | null;
    experience?: string | null;
    coverLetter?: string | null;
    riskFactors: Array<{
      type: string;
      description: string;
      severity: "low" | "medium" | "high";
    }>;
    screening?: {
      score?: number;
      analysis?: string | null;
    };
  };
  vacancyData: {
    title: string;
    requirements?: string | null;
    description?: string | null;
  };
}

/**
 * Вход для оркестратора рекрутера
 */
export interface RecruiterOrchestratorInput {
  message: string;
  workspaceId: string;
  vacancyId?: string;
  candidateId?: string;
  responseId?: string;
  /** Контекст отклика для режима интервью (подгружается API) */
  responseContext?: ResponseInterviewContext;
  conversationHistory: ConversationMessage[];
}

/**
 * Выполненное действие
 */
export interface ExecutedAction {
  id: string;
  type: string;
  params: Record<string, unknown>;
  result: "success" | "failed" | "pending_approval";
  explanation: string;
  timestamp: Date;
  canUndo: boolean;
  undoDeadline?: Date;
}

/**
 * Рекомендация агента
 */
export interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: number;
  action?: {
    type: string;
    params: Record<string, unknown>;
  };
}

/**
 * Результат поиска кандидата
 */
export interface CandidateResult {
  id: string;
  name: string;
  fitScore: number;
  resumeScore: number;
  interviewScore?: number;
  priorityScore?: number; // Приоритетный score для просмотра
  whySelected: string;
  availability: {
    status: "immediate" | "2_weeks" | "1_month" | "unknown";
    confirmedAt?: Date;
  };
  riskFactors: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
  }>;
  recommendation: {
    action: "invite" | "clarify" | "reject";
    reason: string;
    confidence: number;
  };
  contacts?: {
    telegram?: string;
    phone?: string;
    email?: string;
  };
}

/**
 * Результат приоритизации кандидатов
 */
export interface PriorityResult {
  responseId: string;
  priorityScore: number; // 0-100
  explanation: string;
  reasons: string[];
}

/**
 * Результат генерации вопросов для интервью
 */
export interface InterviewQuestionsResult {
  questions: Array<{
    question: string;
    purpose:
      | "risk_clarification"
      | "skill_verification"
      | "culture_fit"
      | "experience_deepening";
    relatedRisk?: string | null;
  }>;
  explanation: string;
}

/**
 * Аналитика вакансии
 */
export interface VacancyAnalytics {
  vacancyId: string;
  metrics: {
    totalResponses: number;
    processedResponses: number;
    highScoreResponses: number;
    avgScore: number;
    conversionRate: number;
  };
  marketComparison: {
    salaryPercentile: number;
    requirementsComplexity: number;
    competitorVacancies: number;
    avgMarketSalary: number;
  };
  issues: VacancyIssue[];
  recommendations: VacancyRecommendation[];
}

/**
 * Проблема вакансии
 */
export interface VacancyIssue {
  type: "salary" | "requirements" | "description" | "timing" | "competition";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  impact: string;
}

/**
 * Рекомендация по вакансии
 */
export interface VacancyRecommendation {
  type:
    | "change_title"
    | "adjust_salary"
    | "simplify_requirements"
    | "improve_description";
  title: string;
  description: string;
  expectedImpact: string;
  priority: number;
}

/**
 * Запись трассировки агента
 */
export interface AgentTraceEntry {
  agent: string;
  decision: string;
  timestamp: Date;
}

/**
 * Выход оркестратора рекрутера
 */
export interface RecruiterOrchestratorOutput {
  response: string;
  intent: RecruiterIntent;
  actions: ExecutedAction[];
  recommendations?: Recommendation[];
  candidates?: CandidateResult[];
  analytics?: VacancyAnalytics;
  priorityResults?: PriorityResult[];
  interviewQuestions?: InterviewQuestionsResult;
  agentTrace: AgentTraceEntry[];
}

/**
 * Расширенный контекст для агентов рекрутера
 */
export interface RecruiterAgentContext extends BaseAgentContext {
  workspaceId: string;
  userId: string;
  currentVacancyId?: string;
  recruiterConversationHistory: ConversationMessage[];
  recruiterCompanySettings: RecruiterCompanySettings;
  recentDecisions: RecruiterDecision[];
  /** История feedback для влияния на рекомендации */
  feedbackHistory?: RecruiterFeedbackHistory;
}

/**
 * Конфигурация оркестратора рекрутера
 */
export interface RecruiterOrchestratorConfig {
  maxSteps?: number;
  maxConversationHistory?: number;
  enableStreaming?: boolean;
}

/**
 * Результат классификации намерения
 */
export interface IntentClassificationResult {
  intent: RecruiterIntent;
  confidence: number;
  extractedEntities: {
    candidateCount?: number;
    availability?: string;
    skills?: string[];
    vacancyId?: string;
    messageType?: string;
  };
}
