/**
 * Сервис для работы с метаданными conversation
 */

import {
  getConversationMetadata,
  getQuestionCount,
  updateConversationMetadata,
} from "@qbs-autonaim/server-utils";
import type { ConversationMetadata } from "@qbs-autonaim/shared";
import { createLogger } from "../base";

const logger = createLogger("ConversationMetadata");

// Re-export функций из shared для обратной совместимости
export {
  getConversationMetadata,
  getQuestionCount,
  updateConversationMetadata,
};
export type { ConversationMetadata };

/**
 * Добавляет вопрос-ответ в историю интервью
 */
export async function addQuestionAnswer(
  conversationId: string,
  question: string,
  answer: string,
): Promise<boolean> {
  try {
    const metadata = await getConversationMetadata(conversationId);
    const questionAnswers = metadata.questionAnswers || [];

    questionAnswers.push({
      question,
      answer,
      timestamp: new Date().toISOString(),
    });

    return await updateConversationMetadata(conversationId, {
      questionAnswers,
      lastQuestionAsked: question,
    });
  } catch (error) {
    logger.error("Error adding question answer", { error, conversationId });
    return false;
  }
}

/**
 * Отмечает интервью как завершенное
 */
export async function markInterviewCompleted(
  conversationId: string,
): Promise<boolean> {
  try {
    return await updateConversationMetadata(conversationId, {
      interviewCompleted: true,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error marking interview completed", {
      error,
      conversationId,
    });
    return false;
  }
}

/**
 * Проверяет, началось ли интервью
 */
export async function isInterviewStarted(
  conversationId: string,
): Promise<boolean> {
  const metadata = await getConversationMetadata(conversationId);
  return metadata.interviewStarted === true;
}

/**
 * Проверяет, завершено ли интервью
 */
export async function isInterviewCompleted(
  conversationId: string,
): Promise<boolean> {
  const metadata = await getConversationMetadata(conversationId);
  return metadata.interviewCompleted === true;
}
