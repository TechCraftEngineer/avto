/**
 * Типы для работы с метаданными conversation
 */

/**
 * Представляет пару вопрос-ответ в интервью
 */
export interface QuestionAnswer {
  /** Текст вопроса */
  question: string;

  /** Ответ кандидата */
  answer: string;

  /** Временная метка (ISO string) */
  timestamp?: string;
}

/**
 * Метаданные conversation
 *
 * Хранит состояние и контекст разговора с кандидатом
 */
export interface ConversationMetadata {
  /** Способ идентификации кандидата */
  identifiedBy?: "pin_code" | "vacancy_search" | "username" | "phone" | "none";

  /** PIN-код для идентификации */
  pinCode?: string;

  /** Username для идентификации */
  username?: string;

  /** Телефон для идентификации */
  phone?: string;

  /** Поисковый запрос по вакансии */
  searchQuery?: string;

  /** Ожидается ли ввод PIN-кода */
  awaitingPin?: boolean;

  /** Началось ли интервью */
  interviewStarted?: boolean;

  /** История вопросов и ответов */
  questionAnswers?: QuestionAnswer[];

  /** Последний заданный вопрос */
  lastQuestionAsked?: string;

  /** Завершено ли интервью */
  interviewCompleted?: boolean;

  /** Время завершения интервью (ISO string) */
  completedAt?: string;

  /** Внутренние заметки/сигналы по интервью (не показывать кандидату) */
  interviewNotes?: Array<{
    type: "note" | "signal";
    content: string;
    tag?: string;
    timestamp: string;
  }>;

  /** Снапшот рубрики оценки, использованной в интервью (для воспроизводимости) */
  interviewRubric?: {
    version?: string;
    entityType?: "gig" | "vacancy" | "unknown";
    criteria: Array<{
      key: string;
      title: string;
      description: string;
      weight: number;
    }>;
  };

  interviewState?: {
    version?: string;
    stage?:
      | "intro"
      | "org"
      | "tech"
      | "wrapup"
      | "profile_review"
      | "task_approach"
      | "motivation";
    askedQuestions?: string[];
    voiceOptionOffered?: boolean;
    updatedAt?: string;
  };

  interviewQuestionBank?: {
    entityType?: "gig" | "vacancy" | "unknown";
    signature?: string;
    organizational?: string[];
    technical?: string[];
    updatedAt?: string;
  };

  /** История детекции использования AI-ботов */
  botDetectionHistory?: Array<{
    timestamp: string;
    questionContext: string;
    answerPreview: string;
    answerLength: number;
    responseTimeSeconds?: number;
    suspicionLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
    indicators: Array<{
      type: "structural" | "lexical" | "behavioral" | "content";
      description: string;
      weight: number;
    }>;
    warningIssued: boolean;
    warningLevel?: "none" | "soft" | "direct" | "strict" | "final";
  }>;

  /** Количество выданных предупреждений о подозрении в использовании AI */
  botWarningCount?: number;

  /** Общий score подозрительности за всё интервью */
  totalBotSuspicionScore?: number;

  /** Последний результат детекции */
  lastBotDetectionResult?: {
    suspicionLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
    scorePenalty: number;
    timestamp: string;
  };

  /** Имя кандидата */
  candidateName?: string;
}
