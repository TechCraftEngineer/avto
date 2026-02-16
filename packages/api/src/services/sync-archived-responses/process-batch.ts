/**
 * Обработка отдельного отклика: нормализация, оценка, обновление БД
 */

import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import type { Recommendation } from "@qbs-autonaim/db/schema";
import {
  response as responseTable,
  responseScreening,
} from "@qbs-autonaim/db/schema";
import type { SyncExecutionContext } from "./context";
import { evaluateResponse, normalizeResponseData } from "./helpers";
import type { ResponseProcessingResult } from "./types";

type ResponseRow = typeof responseTable.$inferSelect;

function getRawData(response: ResponseRow): Record<string, unknown> {
  return {
    candidateName: response.candidateName,
    email: response.email,
    phone: response.phone,
    telegramUsername: response.telegramUsername,
    skills: response.skills,
    profileUrl: response.profileUrl,
    resumeUrl: response.resumeUrl,
    salaryExpectationsAmount: response.salaryExpectationsAmount,
  };
}

/**
 * Обрабатывает один отклик: нормализация, оценка, обновление в БД
 */
export async function processSingleResponse(
  context: SyncExecutionContext,
  response: ResponseRow,
  options: {
    analyzeResponses: boolean;
    onResponseProcessed?: (result: ResponseProcessingResult) => void | Promise<void>;
  },
): Promise<{ success: true; processedCount: number } | { success: false; error: string }> {
  try {
    const rawData = getRawData(response);
    const normalizedData = normalizeResponseData(rawData);

    if (options.analyzeResponses) {
      await context.changeStage(
        "analysis",
        `Анализ отклика: ${normalizedData.candidateName || response.id}`,
      );

      const evaluation = await evaluateResponse(response.id, normalizedData);

      await db
        .update(responseTable)
        .set({
          status: evaluation.status,
          hrSelectionStatus: evaluation.hrStatus,
          updatedAt: new Date(),
        })
        .where(eq(responseTable.id, response.id));

      const existingScreening = await db.query.responseScreening.findFirst({
        where: eq(responseScreening.responseId, response.id),
      });

      if (existingScreening) {
        await db
          .update(responseScreening)
          .set({
            overallScore: evaluation.priority,
            recommendation: evaluation.recommendation as Recommendation,
            screenedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(responseScreening.id, existingScreening.id));
      } else {
        await db.insert(responseScreening).values({
          responseId: response.id,
          overallScore: evaluation.priority,
          recommendation: evaluation.recommendation as Recommendation,
          screenedAt: new Date(),
        });
      }

      context.addProcessingResult({
        responseId: response.id,
        candidateName: String(normalizedData.candidateName || "Unknown"),
        status: "success",
        screeningResult: {
          overallScore: evaluation.priority,
          recommendation: evaluation.recommendation,
        },
      });
    } else {
      context.addProcessingResult({
        responseId: response.id,
        candidateName: String(normalizedData.candidateName || "Unknown"),
        status: "success",
      });
    }

    const lastResult = context.getLastProcessingResult();
    if (lastResult) {
      await options.onResponseProcessed?.(lastResult);
    }

    return { success: true, processedCount: 1 };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    return { success: false, error: errorMessage };
  }
}
