"use client";

// Типы для интерактивного AI-чата создания вакансий

export interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
  bonuses?: string;
  customBotInstructions?: string;
  customScreeningPrompt?: string;
  customInterviewQuestions?: string;
  customOrganizationalQuestions?: string;
}

export interface QuickReply {
  id: string;
  label: string;
  value: string;
  /** Если true, можно выбрать несколько вариантов */
  multiSelect?: boolean;
  /** Если true, при клике открывается поле свободного ввода */
  freeform?: boolean;
  /** Placeholder для поля свободного ввода */
  placeholder?: string;
  /** Максимальная длина для поля свободного ввода */
  maxLength?: number;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickReplies?: QuickReply[];
  /** Если true, quick replies поддерживают мультивыбор */
  isMultiSelect?: boolean;
  isStreaming?: boolean;
  timestamp: Date;
}

export type ChatStatus = "idle" | "loading" | "streaming" | "error";

export interface ChatError {
  type: "network" | "parse" | "validation" | "timeout" | "unknown";
  message: string;
  retryable: boolean;
}
