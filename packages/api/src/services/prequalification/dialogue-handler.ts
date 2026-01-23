/**
 * Dialogue Handler for Prequalification Service
 *
 * Обрабатывает сообщения диалога между кандидатом и AI-ассистентом.
 * Интегрируется с InterviewOrchestrator для генерации ответов.
 */

import type {
  DbClient,
  ParsedResume,
  VacancyRequirements,
} from "@qbs-autonaim/db";
import {
  interviewMessage,
  interviewSession,
  prequalificationSession,
  response,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { and, asc, eq } from "drizzle-orm";

import type {
  AIResponse,
  DialogueMessage,
  SessionStatus,
  WorkspacePrequalificationConfig,
} from "./types";
import { PrequalificationError } from "./types";

/**
 * Контекст диалога для AI
 */
interface DialogueContext {
  sessionId: string;
  workspaceId: string;
  vacancyId: string;
  interviewSessionId: string | null;
  parsedResume: ParsedResume | null;
  vacancyTitle: string;
  vacancyDescription: string | null;
  vacancyRequirements: VacancyRequirements | null;
  config: WorkspacePrequalificationConfig;
  conversationHistory: DialogueMessage[];
}

/**
 * Результат обработки сообщения
 */
export interface ProcessMessageResult {
  response: AIResponse;
  dialogueComplete: boolean;
  newStatus: SessionStatus;
  mandatoryQuestionsAsked: string[];
}

/**
 * Обработчик диалогов преквалификации
 */
export class DialogueHandler {
  constructor(private db: DbClient) {}

  /**
   * Получает контекст диалога для сессии
   */
  async getDialogueContext(
    sessionId: string,
    workspaceId: string,
    config: WorkspacePrequalificationConfig,
  ): Promise<DialogueContext> {
    // Получаем сессию с вакансией
    const [session] = await this.db
      .select({
        id: prequalificationSession.id,
        workspaceId: prequalificationSession.workspaceId,
        vacancyId: prequalificationSession.vacancyId,
        interviewSessionId: prequalificationSession.interviewSessionId,
        parsedResume: prequalificationSession.parsedResume,
        status: prequalificationSession.status,
      })
      .from(prequalificationSession)
      .where(
        and(
          eq(prequalificationSession.id, sessionId),
          eq(prequalificationSession.workspaceId, workspaceId),
        ),
      )
      .limit(1);

    if (!session) {
      throw new PrequalificationError(
        "SESSION_NOT_FOUND",
        "Сессия не найдена",
        { sessionId },
      );
    }

    if (session.workspaceId !== workspaceId) {
      throw new PrequalificationError(
        "TENANT_MISMATCH",
        "Сессия не принадлежит указанному workspace",
        { sessionId, requestedWorkspaceId: workspaceId },
      );
    }

    // Получаем данные вакансии
    const [vacancyData] = await this.db
      .select({
        id: vacancy.id,
        title: vacancy.title,
        description: vacancy.description,
        requirements: vacancy.requirements,
      })
      .from(vacancy)
      .where(eq(vacancy.id, session.vacancyId))
      .limit(1);

    if (!vacancyData) {
      throw new PrequalificationError(
        "VACANCY_NOT_FOUND",
        "Вакансия не найдена",
        { vacancyId: session.vacancyId },
      );
    }

    // Получаем историю диалога если есть interviewSessionId
    let conversationHistory: DialogueMessage[] = [];
    if (session.interviewSessionId) {
      conversationHistory = await this.getConversationHistory(
        session.interviewSessionId,
      );
    }

    return {
      sessionId: session.id,
      workspaceId: session.workspaceId,
      vacancyId: session.vacancyId,
      interviewSessionId: session.interviewSessionId,
      parsedResume: session.parsedResume,
      vacancyTitle: vacancyData.title,
      vacancyDescription: vacancyData.description,
      vacancyRequirements: vacancyData.requirements,
      config,
      conversationHistory,
    };
  }

  /**
   * Получает историю диалога из базы данных
   */
  async getConversationHistory(
    interviewSessionId: string,
  ): Promise<DialogueMessage[]> {
    const messages = await this.db
      .select({
        content: interviewMessage.content,
        role: interviewMessage.role,
        createdAt: interviewMessage.createdAt,
      })
      .from(interviewMessage)
      .where(eq(interviewMessage.sessionId, interviewSessionId))
      .orderBy(asc(interviewMessage.createdAt));

    return messages.map((msg) => ({
      role:
        msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: msg.content ?? "",
      timestamp: msg.createdAt,
    }));
  }

  /**
   * Сохраняет сообщение в историю диалога
   */
  async saveMessage(
    interviewSessionId: string,
    content: string,
    role: "user" | "assistant",
  ): Promise<void> {
    await this.db.insert(interviewMessage).values({
      sessionId: interviewSessionId,
      content,
      role,
      type: "text",
      channel: "web",
    });
  }

  /**
   * Создаёт новую interviewSession для преквалификации
   */
  async createInterviewSession(
    prequalSessionId: string,
    workspaceId: string,
    candidateName?: string,
  ): Promise<string> {
    // For prequalification, we need to create a minimal response record first
    // since interviewSession requires a responseId
    const [newResponse] = await this.db
      .insert(response)
      .values({
        entityType: "vacancy", // Default to vacancy for prequalification
        entityId: "00000000-0000-0000-0000-000000000000", // Placeholder UUID
        candidateId: `preq_${prequalSessionId}`,
        candidateName: candidateName || "Кандидат",
        status: "NEW",
        experience: "",
        contacts: null,
        phone: null,
      })
      .returning({ id: response.id });

    if (!newResponse) {
      throw new PrequalificationError(
        "INTERVIEW_SESSION_CREATION_FAILED",
        "Не удалось создать запись отклика",
        { prequalSessionId },
      );
    }

    const [newSession] = await this.db
      .insert(interviewSession)
      .values({
        responseId: newResponse.id,
        status: "active",
        lastChannel: "web",
        metadata: {
          prequalificationSessionId: prequalSessionId,
          workspaceId,
        },
      })
      .returning({ id: interviewSession.id });

    if (!newSession) {
      throw new PrequalificationError(
        "INTERVIEW_SESSION_CREATION_FAILED",
        "Не удалось создать сессию интервью",
        { prequalSessionId },
      );
    }

    // Обновляем сессию преквалификации с interviewSessionId
    await this.db
      .update(prequalificationSession)
      .set({ interviewSessionId: newSession.id })
      .where(
        and(
          eq(prequalificationSession.id, prequalSessionId),
          eq(prequalificationSession.workspaceId, workspaceId),
        ),
      );

    return newSession.id;
  }

  /**
   * Проверяет, были ли заданы все обязательные вопросы
   */
  checkMandatoryQuestions(
    conversationHistory: DialogueMessage[],
    mandatoryQuestions: string[],
  ): {
    allAsked: boolean;
    askedQuestions: string[];
    missingQuestions: string[];
  } {
    if (mandatoryQuestions.length === 0) {
      return {
        allAsked: true,
        askedQuestions: [],
        missingQuestions: [],
      };
    }

    const askedQuestions: string[] = [];
    const missingQuestions: string[] = [];

    // Получаем все сообщения от ассистента
    const assistantMessages = conversationHistory
      .filter((msg) => msg.role === "assistant")
      .map((msg) => msg.content.toLowerCase());

    for (const question of mandatoryQuestions) {
      const questionLower = question.toLowerCase();
      // Проверяем, содержится ли вопрос (или его ключевые слова) в сообщениях
      const isAsked = assistantMessages.some((msg) =>
        this.questionMatches(msg, questionLower),
      );

      if (isAsked) {
        askedQuestions.push(question);
      } else {
        missingQuestions.push(question);
      }
    }

    return {
      allAsked: missingQuestions.length === 0,
      askedQuestions,
      missingQuestions,
    };
  }

  /**
   * Проверяет, соответствует ли сообщение вопросу
   */
  private questionMatches(message: string, question: string): boolean {
    // Простая проверка на вхождение ключевых слов
    const keywords = question.split(/\s+/).filter((word) => word.length > 3);

    // Если хотя бы 60% ключевых слов присутствуют в сообщении
    const matchCount = keywords.filter((keyword) =>
      message.includes(keyword),
    ).length;

    return matchCount >= Math.ceil(keywords.length * 0.6);
  }

  /**
   * Определяет, достаточно ли информации для завершения диалога
   */
  isDialogueSufficient(
    conversationHistory: DialogueMessage[],
    config: WorkspacePrequalificationConfig,
  ): boolean {
    // Подсчитываем количество обменов (вопрос-ответ)
    const userMessages = conversationHistory.filter(
      (msg) => msg.role === "user",
    ).length;

    // Минимум 3 обмена для базовой оценки
    const minExchanges = 3;

    // Проверяем, достигнут ли максимум или минимум
    if (userMessages >= config.maxDialogueTurns) {
      return true;
    }

    if (userMessages < minExchanges) {
      return false;
    }

    return false;
  }

  /**
   * Генерирует приветственное сообщение
   */
  generateWelcomeMessage(
    vacancyTitle: string,
    parsedResume: ParsedResume | null,
    config: WorkspacePrequalificationConfig,
  ): string {
    const candidateName = parsedResume?.structured?.personalInfo?.name;
    const greeting = candidateName
      ? `Здравствуйте, ${candidateName}!`
      : "Здравствуйте!";

    const tone = config.tone === "formal" ? "formal" : "friendly";

    if (tone === "formal") {
      return `${greeting} Благодарим вас за интерес к позиции "${vacancyTitle}". Я AI-ассистент, который поможет оценить ваше соответствие данной вакансии. Пожалуйста, ответьте на несколько вопросов, чтобы мы могли лучше понять ваш опыт и навыки.`;
    }

    return `${greeting} Рад, что вы заинтересовались позицией "${vacancyTitle}"! Я AI-ассистент, и мы сейчас немного пообщаемся, чтобы понять, насколько эта вакансия вам подходит. Готовы начать?`;
  }
}
