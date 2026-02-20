/**
 * Conversation Context Management для AI-ассистента рекрутера
 * Управляет загрузкой контекста (workspace, vacancy, company settings)
 * и накоплением истории диалога
 */

import type {
  CompanySettings,
  ExtendedWorkspaceData,
} from "@qbs-autonaim/shared";
import type {
  ConversationMessage,
  RecruiterAgentContext,
  RecruiterCompanySettings,
  RecruiterConversationContext,
  RecruiterDecision,
  RecruiterFeedbackEntry,
  RecruiterFeedbackHistory,
  RecruiterFeedbackStats,
} from "./types";

/**
 * Максимальное количество сообщений в истории диалога
 */
export const MAX_CONVERSATION_HISTORY = 20;

/**
 * Данные вакансии для контекста
 */
export interface VacancyData {
  id: string;
  title: string;
  description?: string | null;
  requirements?: {
    job_title: string;
    summary: string;
    mandatory_requirements: string[];
    nice_to_have_skills: string[];
    tech_stack: string[];
    experience_years: {
      min: number | null;
      description: string;
    };
    languages: Array<{
      language: string;
      level: string;
    }>;
    location_type: string;
    keywords_for_matching: string[];
  } | null;
  customBotInstructions?: string | null;
  customInterviewQuestions?: string | null;
  customOrganizationalQuestions?: string | null;
}

/**
 * Входные данные для построения контекста
 */
export interface ContextBuilderInput {
  workspaceId: string;
  userId: string;
  vacancyId?: string;
  workspace?: ExtendedWorkspaceData | null;
  companySettings?: CompanySettings | null;
  vacancy?: VacancyData | null;
  conversationHistory?: ConversationMessage[];
  recentDecisions?: RecruiterDecision[];
  /** История feedback для влияния на рекомендации */
  feedbackHistory?: RecruiterFeedbackHistory;
}

/**
 * Класс для управления контекстом диалога рекрутера
 */
export class RecruiterContextManager {
  private maxHistoryLength: number;

  constructor(maxHistoryLength: number = MAX_CONVERSATION_HISTORY) {
    this.maxHistoryLength = maxHistoryLength;
  }

  /**
   * Строит полный контекст для агентов
   */
  buildContext(input: ContextBuilderInput): RecruiterAgentContext {
    const companySettings = this.buildCompanySettings(
      input.workspace,
      input.companySettings,
    );

    const conversationHistory = this.limitHistory(
      input.conversationHistory || [],
    );

    return {
      conversationId: input.workspaceId,
      conversationHistory: conversationHistory.map((msg) => ({
        sender: msg.role === "user" ? ("CANDIDATE" as const) : ("BOT" as const),
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      vacancyTitle: input.vacancy?.title,
      vacancyDescription: input.vacancy?.description || undefined,
      vacancyRequirements: input.vacancy?.requirements
        ? JSON.stringify(input.vacancy.requirements)
        : undefined,
      customBotInstructions: input.vacancy?.customBotInstructions,
      customInterviewQuestions: input.vacancy?.customInterviewQuestions,
      customOrganizationalQuestions:
        input.vacancy?.customOrganizationalQuestions,

      // RecruiterAgentContext fields
      workspaceId: input.workspaceId,
      userId: input.userId,
      currentVacancyId: input.vacancyId,
      recruiterConversationHistory: conversationHistory,
      recruiterCompanySettings: companySettings,
      recentDecisions: input.recentDecisions || [],
      feedbackHistory: input.feedbackHistory,
    };
  }

  /**
   * Строит RecruiterConversationContext для хранения состояния
   */
  buildConversationContext(
    input: ContextBuilderInput,
  ): RecruiterConversationContext {
    const companySettings = this.buildCompanySettings(
      input.workspace,
      input.companySettings,
    );

    return {
      workspaceId: input.workspaceId,
      userId: input.userId,
      currentVacancyId: input.vacancyId,
      conversationHistory: this.limitHistory(input.conversationHistory || []),
      companySettings,
      recentDecisions: input.recentDecisions || [],
      feedbackHistory: input.feedbackHistory,
    };
  }

  /**
   * Добавляет сообщение в историю диалога
   */
  addMessage(
    history: ConversationMessage[],
    message: Omit<ConversationMessage, "timestamp">,
  ): ConversationMessage[] {
    const newMessage: ConversationMessage = {
      ...message,
      timestamp: new Date(),
    };

    const updatedHistory = [...history, newMessage];
    return this.limitHistory(updatedHistory);
  }

  /**
   * Добавляет сообщение пользователя
   */
  addUserMessage(
    history: ConversationMessage[],
    content: string,
  ): ConversationMessage[] {
    return this.addMessage(history, {
      role: "user",
      content,
    });
  }

  /**
   * Добавляет сообщение ассистента
   */
  addAssistantMessage(
    history: ConversationMessage[],
    content: string,
    metadata?: ConversationMessage["metadata"],
  ): ConversationMessage[] {
    return this.addMessage(history, {
      role: "assistant",
      content,
      metadata,
    });
  }

  /**
   * Ограничивает историю диалога до максимального размера
   */
  limitHistory(history: ConversationMessage[]): ConversationMessage[] {
    if (history.length <= this.maxHistoryLength) {
      return history;
    }

    // Удаляем старые сообщения, сохраняя последние maxHistoryLength
    return history.slice(-this.maxHistoryLength);
  }

  /**
   * Обновляет текущую вакансию в контексте
   */
  updateCurrentVacancy(
    context: RecruiterConversationContext,
    vacancyId: string | undefined,
  ): RecruiterConversationContext {
    return {
      ...context,
      currentVacancyId: vacancyId,
    };
  }

  /**
   * Добавляет решение рекрутера для обучения
   */
  addDecision(
    context: RecruiterConversationContext,
    decision: Omit<RecruiterDecision, "id" | "timestamp">,
  ): RecruiterConversationContext {
    const newDecision: RecruiterDecision = {
      ...decision,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    // Храним последние 50 решений
    const recentDecisions = [...context.recentDecisions, newDecision].slice(
      -50,
    );

    return {
      ...context,
      recentDecisions,
    };
  }

  /**
   * Очищает историю диалога
   */
  clearHistory(
    context: RecruiterConversationContext,
  ): RecruiterConversationContext {
    return {
      ...context,
      conversationHistory: [],
    };
  }

  /**
   * Строит настройки компании из workspace и company settings
   */
  private buildCompanySettings(
    workspace?: ExtendedWorkspaceData | null,
    companySettings?: CompanySettings | null,
  ): RecruiterCompanySettings {
    return {
      name: companySettings?.name || workspace?.name || "Компания",
      description:
        companySettings?.description || workspace?.description || undefined,
      botName: companySettings?.botName || "AI-ассистент",
      botRole: companySettings?.botRole || "рекрутер",
      communicationStyle: "professional",
      defaultAutonomyLevel: "advise",
    };
  }

  /**
   * Получает последние N сообщений из истории
   */
  getRecentMessages(
    history: ConversationMessage[],
    count: number,
  ): ConversationMessage[] {
    return history.slice(-count);
  }

  /**
   * Проверяет, есть ли в истории сообщения определенного типа
   */
  hasMessagesWithIntent(
    history: ConversationMessage[],
    intent: string,
  ): boolean {
    return history.some((msg) => msg.metadata?.intent === intent);
  }

  /**
   * Получает статистику по истории диалога
   */
  getHistoryStats(history: ConversationMessage[]): {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    intents: Record<string, number>;
  } {
    const stats = {
      totalMessages: history.length,
      userMessages: 0,
      assistantMessages: 0,
      intents: {} as Record<string, number>,
    };

    for (const msg of history) {
      if (msg.role === "user") {
        stats.userMessages++;
      } else {
        stats.assistantMessages++;
      }

      if (msg.metadata?.intent) {
        stats.intents[msg.metadata.intent] =
          (stats.intents[msg.metadata.intent] || 0) + 1;
      }
    }

    return stats;
  }
}

/**
 * Singleton instance для использования в приложении
 */
export const recruiterContextManager = new RecruiterContextManager();

/**
 * Хелпер для создания пустого контекста
 */
export function createEmptyContext(
  workspaceId: string,
  userId: string,
): RecruiterConversationContext {
  return {
    workspaceId,
    userId,
    currentVacancyId: undefined,
    conversationHistory: [],
    companySettings: {
      name: "Компания",
      botName: "AI-ассистент",
      botRole: "рекрутер",
      communicationStyle: "professional",
      defaultAutonomyLevel: "advise",
    },
    recentDecisions: [],
  };
}

/**
 * Хелпер для сериализации контекста (для хранения в Redis/DB)
 */
export function serializeContext(
  context: RecruiterConversationContext,
): string {
  return JSON.stringify(context, (_key, value) => {
    if (value instanceof Date) {
      return { __type: "Date", value: value.toISOString() };
    }
    return value;
  });
}

/**
 * Хелпер для десериализации контекста
 */
export function deserializeContext(json: string): RecruiterConversationContext {
  return JSON.parse(json, (_key, value) => {
    if (value && typeof value === "object" && value.__type === "Date") {
      return new Date(value.value);
    }
    return value;
  });
}

/**
 * Создаёт пустую историю feedback
 */
export function createEmptyFeedbackHistory(): RecruiterFeedbackHistory {
  return {
    entries: [],
    stats: {
      total: 0,
      accepted: 0,
      rejected: 0,
      modified: 0,
      acceptanceRate: 0,
      rejectionRate: 0,
    },
  };
}

/**
 * Создаёт историю feedback из данных БД
 */
export function createFeedbackHistory(
  entries: RecruiterFeedbackEntry[],
  stats: RecruiterFeedbackStats,
): RecruiterFeedbackHistory {
  return { entries, stats };
}

/**
 * Рассчитывает модификатор уверенности на основе feedback history
 *
 * Если рекрутер часто отклоняет рекомендации определённого типа,
 * уверенность в таких рекомендациях снижается.
 *
 * @param feedbackHistory - История feedback пользователя
 * @param recommendationType - Тип рекомендации (invite, clarify, reject)
 * @returns Модификатор уверенности (0.5 - 1.5)
 */
export function calculateConfidenceModifier(
  feedbackHistory: RecruiterFeedbackHistory | undefined,
  _recommendationType: "invite" | "clarify" | "reject",
): number {
  if (!feedbackHistory || feedbackHistory.stats.total === 0) {
    return 1.0; // Нет истории - базовая уверенность
  }

  const { stats } = feedbackHistory;

  // Базовый модификатор на основе общего acceptance rate
  let modifier = 1.0;

  // Если acceptance rate высокий (> 70%), увеличиваем уверенность
  if (stats.acceptanceRate > 70) {
    modifier = 1.0 + (stats.acceptanceRate - 70) / 100; // max 1.3
  }
  // Если acceptance rate низкий (< 50%), снижаем уверенность
  else if (stats.acceptanceRate < 50) {
    modifier = 0.5 + stats.acceptanceRate / 100; // min 0.5
  }

  // Анализируем последние отклонения для конкретного типа рекомендации
  const recentRejections = feedbackHistory.entries
    .filter((e) => e.feedbackType === "rejected")
    .slice(0, 10);

  // Если много недавних отклонений, дополнительно снижаем уверенность
  if (recentRejections.length >= 5) {
    modifier *= 0.9;
  }

  // Ограничиваем модификатор диапазоном [0.5, 1.5]
  return Math.max(0.5, Math.min(1.5, modifier));
}

/**
 * Анализирует паттерны отклонений для улучшения рекомендаций
 *
 * @param feedbackHistory - История feedback пользователя
 * @returns Паттерны отклонений с причинами
 */
export function analyzeRejectionPatterns(
  feedbackHistory: RecruiterFeedbackHistory | undefined,
): {
  commonReasons: string[];
  rejectionRate: number;
  recentTrend: "improving" | "stable" | "declining";
} {
  if (!feedbackHistory || feedbackHistory.stats.total === 0) {
    return {
      commonReasons: [],
      rejectionRate: 0,
      recentTrend: "stable",
    };
  }

  const { entries, stats } = feedbackHistory;

  // Собираем причины отклонений
  const reasons = entries
    .filter((e) => e.feedbackType === "rejected" && e.reason)
    .map((e) => e.reason as string);

  // Находим наиболее частые причины
  const reasonCounts = new Map<string, number>();
  for (const reason of reasons) {
    const normalized = reason.toLowerCase().trim();
    reasonCounts.set(normalized, (reasonCounts.get(normalized) || 0) + 1);
  }

  const commonReasons = Array.from(reasonCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason]) => reason);

  // Анализируем тренд (последние 10 vs предыдущие 10)
  const recent = entries.slice(0, 10);
  const previous = entries.slice(10, 20);

  const recentAcceptance =
    recent.filter((e) => e.feedbackType === "accepted").length / recent.length;
  const previousAcceptance =
    previous.length > 0
      ? previous.filter((e) => e.feedbackType === "accepted").length /
        previous.length
      : recentAcceptance;

  let recentTrend: "improving" | "stable" | "declining" = "stable";
  if (recentAcceptance > previousAcceptance + 0.1) {
    recentTrend = "improving";
  } else if (recentAcceptance < previousAcceptance - 0.1) {
    recentTrend = "declining";
  }

  return {
    commonReasons,
    rejectionRate: stats.rejectionRate,
    recentTrend,
  };
}

/**
 * Генерирует подсказку для LLM на основе feedback history
 *
 * @param feedbackHistory - История feedback пользователя
 * @returns Строка с подсказкой для включения в промпт
 */
export function generateFeedbackPromptHint(
  feedbackHistory: RecruiterFeedbackHistory | undefined,
): string {
  if (!feedbackHistory || feedbackHistory.stats.total < 5) {
    return ""; // Недостаточно данных для подсказки
  }

  const patterns = analyzeRejectionPatterns(feedbackHistory);
  const hints: string[] = [];

  // Добавляем информацию о acceptance rate
  if (feedbackHistory.stats.acceptanceRate < 50) {
    hints.push(
      `Рекрутер часто отклоняет рекомендации (acceptance rate: ${feedbackHistory.stats.acceptanceRate}%). Будь более консервативен в рекомендациях.`,
    );
  } else if (feedbackHistory.stats.acceptanceRate > 80) {
    hints.push(
      `Рекрутер обычно принимает рекомендации (acceptance rate: ${feedbackHistory.stats.acceptanceRate}%). Можно быть более уверенным.`,
    );
  }

  // Добавляем информацию о частых причинах отклонений
  if (patterns.commonReasons.length > 0) {
    hints.push(
      `Частые причины отклонений: ${patterns.commonReasons.join(", ")}. Учитывай это при формировании рекомендаций.`,
    );
  }

  // Добавляем информацию о тренде
  if (patterns.recentTrend === "declining") {
    hints.push(
      "Качество рекомендаций снижается. Обрати особое внимание на точность.",
    );
  }

  return hints.length > 0
    ? `\n\n[Контекст на основе истории решений рекрутера]\n${hints.join("\n")}`
    : "";
}
