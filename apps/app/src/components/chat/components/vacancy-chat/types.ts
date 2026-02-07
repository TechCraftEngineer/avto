"use client";

// Типы для интерактивного AI-чата создания вакансий

export interface VacancyDocument {
  // Основная информация
  title?: string;
  description?: string;

  // Опыт работы
  experienceYears?: {
    min?: number;
    max?: number;
  };

  // Тип занятости
  employmentType?: "full" | "part" | "project" | "internship" | "volunteer";

  // Формат работы
  workFormat?: "office" | "remote" | "hybrid";

  // Оформление сотрудника
  employmentContract?:
    | "employment"
    | "contract"
    | "self_employed"
    | "individual";

  // График и часы работы
  schedule?: "full_day" | "shift" | "flexible" | "remote_schedule" | "watch";
  workingHours?: string; // Например: "9:00-18:00" или "5/2"

  // Оплата работы
  salary?: {
    from?: number;
    to?: number;
    currency?: "RUB" | "USD" | "EUR";
    gross?: boolean; // true = до вычета налогов, false = на руки
  };

  // Описание вакансии (структурированное)
  responsibilities?: string;
  requirements?: string;
  conditions?: string;
  bonuses?: string;

  // Навыки
  skills?: string[];

  // Настройки бота
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
