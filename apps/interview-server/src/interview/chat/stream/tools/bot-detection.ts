/**
 * Tool для анализа аутентичности ответов кандидата
 * Детектирует использование AI-ботов (ChatGPT, Claude и т.д.)
 * Вся логика анализа делегирована AI-агентам
 */

import {
  AgentFactory,
  determineWarningLevel,
  getInterviewerRecommendation,
  getWarningMessage,
  type WarningLevel,
} from "@qbs-autonaim/ai";
import {
  getInterviewSessionMetadata,
  updateInterviewSessionMetadata,
} from "@qbs-autonaim/server-utils";
import type { LanguageModel } from "ai";
import { tool } from "ai";
import { z } from "zod";

// ==================== TYPES ====================

export type { WarningLevel };
export type SuspicionLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export interface BotIndicator {
  type: "structural" | "lexical" | "behavioral" | "content";
  description: string;
  weight: number;
}

export interface BotDetectionRecord {
  timestamp: string;
  questionContext: string;
  answerPreview: string;
  answerLength: number;
  responseTimeSeconds?: number;
  suspicionLevel: SuspicionLevel;
  indicators: BotIndicator[];
  warningIssued: boolean;
  warningLevel?: WarningLevel;
}

// ==================== TOOLS ====================

export function createAnalyzeResponseAuthenticityTool(
  sessionId: string,
  model: LanguageModel,
) {
  return tool({
    description: `Анализирует ответ кандидата на признаки использования AI-ботов.
Вызывай после содержательных ответов (> 80 символов). Не вызывай на "ок", "понял".
Если shouldWarn = true, включи warningMessage в ответ.`,
    inputSchema: z.object({
      answer: z.string().min(1).describe("Ответ кандидата для анализа"),
      questionContext: z
        .string()
        .describe("Вопрос, на который отвечал кандидат"),
      responseTimeSeconds: z
        .number()
        .optional()
        .describe("Время ответа в секундах"),
      conversationHistory: z
        .array(
          z.object({
            sender: z.enum(["CANDIDATE", "BOT"]),
            content: z.string(),
          }),
        )
        .optional()
        .describe("История диалога для контекста"),
    }),
    execute: async (args: Record<string, unknown>) => {
      const {
        answer,
        questionContext,
        responseTimeSeconds,
        conversationHistory,
      } = args as {
        answer: string;
        questionContext: string;
        responseTimeSeconds?: number;
        conversationHistory?: Array<{
          sender: "CANDIDATE" | "BOT";
          content: string;
        }>;
      };

      const metadata = await getInterviewSessionMetadata(sessionId);
      const botDetectionHistory =
        (metadata.botDetectionHistory as BotDetectionRecord[] | undefined) ??
        [];
      const warningCount =
        (metadata.botWarningCount as number | undefined) ?? 0;

      // Короткие ответы не анализируем
      if (answer.length < 80) {
        return {
          suspicionLevel: "NONE" as SuspicionLevel,
          confidence: 1,
          indicators: [],
          shouldWarn: false,
          warningMessage: null,
          warningLevel: "none" as WarningLevel,
          scorePenalty: 0,
          recommendation: "Ответ слишком короткий для анализа.",
          warningCount,
        };
      }

      // Создаём агент для анализа
      const factory = new AgentFactory({ model });
      const detector = factory.createBotUsageDetector();

      const responseTimeMs = responseTimeSeconds
        ? responseTimeSeconds * 1000
        : 0;

      // Вызываем AI-агент для анализа
      const result = await detector.execute(
        {
          currentMessage: answer,
          responseTimeMs,
          messageLength: answer.length,
          questionContext,
        },
        {
          conversationHistory: conversationHistory ?? [],
        },
      );

      if (!result.success || !result.data) {
        // Fallback при ошибке агента
        return {
          suspicionLevel: "NONE" as SuspicionLevel,
          confidence: 0,
          indicators: [],
          shouldWarn: false,
          warningMessage: null,
          warningLevel: "none" as WarningLevel,
          scorePenalty: 0,
          recommendation: "Не удалось проанализировать ответ.",
          warningCount,
          error: result.error,
        };
      }

      const agentResult = result.data;

      // Определяем уровень предупреждения на основе истории
      const warningLevel = determineWarningLevel(
        agentResult.suspicionLevel,
        warningCount,
      );
      const shouldWarn = warningLevel !== "none";
      const warningMessage = getWarningMessage(warningLevel);

      const recommendation = getInterviewerRecommendation(
        agentResult.suspicionLevel,
        warningCount,
      );

      // Сохраняем результат в историю
      const detection: BotDetectionRecord = {
        timestamp: new Date().toISOString(),
        questionContext,
        answerPreview:
          answer.substring(0, 100) + (answer.length > 100 ? "..." : ""),
        answerLength: answer.length,
        responseTimeSeconds,
        suspicionLevel: agentResult.suspicionLevel,
        indicators: agentResult.indicators,
        warningIssued: shouldWarn,
        warningLevel: shouldWarn ? warningLevel : undefined,
      };

      const newHistory = [...botDetectionHistory, detection];
      const newWarningCount = shouldWarn ? warningCount + 1 : warningCount;
      const totalSuspicionScore = calculateTotalSuspicionScore(newHistory);

      await updateInterviewSessionMetadata(sessionId, {
        botDetectionHistory: newHistory,
        botWarningCount: newWarningCount,
        totalBotSuspicionScore: totalSuspicionScore,
        lastBotDetectionResult: {
          suspicionLevel: agentResult.suspicionLevel,
          scorePenalty: agentResult.scorePenalty,
          timestamp: detection.timestamp,
        },
      });

      return {
        suspicionLevel: agentResult.suspicionLevel,
        confidence: agentResult.confidence,
        indicators: agentResult.indicators,
        shouldWarn,
        warningMessage,
        warningLevel,
        scorePenalty: agentResult.scorePenalty,
        recommendation,
        warningCount: newWarningCount,
        totalSuspicionScore,
        analysis: agentResult.analysis,
      };
    },
  });
}

export function createGetBotDetectionSummaryTool(
  sessionId: string,
  model: LanguageModel,
) {
  return tool({
    description: `Возвращает сводку по детекции AI-ботов за всё интервью.
Вызывай при завершении для учёта в оценке.`,
    inputSchema: z.object({}),
    execute: async () => {
      const metadata = await getInterviewSessionMetadata(sessionId);

      const history =
        (metadata.botDetectionHistory as BotDetectionRecord[] | undefined) ??
        [];
      const warningCount =
        (metadata.botWarningCount as number | undefined) ?? 0;
      const totalScore =
        (metadata.totalBotSuspicionScore as number | undefined) ?? 0;

      if (history.length === 0) {
        return {
          analyzed: false,
          message: "Анализ аутентичности не проводился",
          totalPenalty: 0,
          recommendation: "Нет данных для оценки аутентичности",
        };
      }

      // Используем AI-агент для анализа сводки
      const factory = new AgentFactory({ model });
      const analyzer = factory.createBotSummaryAnalyzer();

      const result = await analyzer.execute(
        {
          history: history.map((h) => ({
            questionContext: h.questionContext,
            answerPreview: h.answerPreview,
            suspicionLevel: h.suspicionLevel,
            indicators: h.indicators,
            warningIssued: h.warningIssued,
          })),
          warningCount,
          totalSuspicionScore: totalScore,
        },
        { conversationHistory: [] },
      );

      if (!result.success || !result.data) {
        // Fallback при ошибке агента
        return {
          analyzed: true,
          totalResponses: history.length,
          warningsIssued: warningCount,
          totalSuspicionScore: totalScore,
          totalPenalty: 0,
          recommendation: "Не удалось проанализировать сводку.",
          error: result.error,
        };
      }

      const agentResult = result.data;

      const levelCounts: Record<SuspicionLevel, number> = {
        NONE: 0,
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
      };
      for (const record of history) {
        levelCounts[record.suspicionLevel]++;
      }

      return {
        analyzed: true,
        totalResponses: history.length,
        levelCounts,
        warningsIssued: warningCount,
        totalSuspicionScore: totalScore,
        totalPenalty: agentResult.totalPenalty,
        recommendation: agentResult.recommendation,
        overallAssessment: agentResult.overallAssessment,
        confidence: agentResult.confidence,
        details: history.map((h) => ({
          question: `${h.questionContext.substring(0, 50)}...`,
          level: h.suspicionLevel,
          warned: h.warningIssued,
        })),
      };
    },
  });
}

// ==================== HELPERS ====================

function calculateTotalSuspicionScore(
  history: Array<{ suspicionLevel: string }>,
): number {
  const weights: Record<string, number> = {
    NONE: 0,
    LOW: 1,
    MEDIUM: 3,
    HIGH: 5,
  };
  return history.reduce((sum, h) => sum + (weights[h.suspicionLevel] ?? 0), 0);
}
