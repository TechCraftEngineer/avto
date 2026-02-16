/**
 * Повторная обработка отдельного отклика
 */

import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import type { Recommendation } from "@qbs-autonaim/db/schema";
import {
  response as responseTable,
  responseScreening,
} from "@qbs-autonaim/db/schema";
import { evaluateResponse, normalizeResponseData } from "./helpers";
import type { ResponseProcessingResult } from "./types";

/**
 * Повторяет обработку отклика: нормализация, оценка, обновление в БД
 */
export async function retryResponse(
  responseId: string,
  _options?: { maxRetries?: number },
): Promise<ResponseProcessingResult> {
  console.log(`[SyncArchived] Повторная обработка отклика ${responseId}`);

  try {
    const response = await db.query.response.findFirst({
      where: eq(responseTable.id, responseId),
    });

    if (!response) {
      throw new Error("Отклик не найден");
    }

    const rawData = {
      candidateName: response.candidateName,
      email: response.email,
      phone: response.phone,
      telegramUsername: response.telegramUsername,
      skills: response.skills,
      profileUrl: response.profileUrl,
      resumeUrl: response.resumeUrl,
      salaryExpectationsAmount: response.salaryExpectationsAmount,
    };

    const normalizedData = normalizeResponseData(rawData);
    const evaluation = await evaluateResponse(responseId, normalizedData);

    await db
      .update(responseTable)
      .set({
        status: evaluation.status,
        hrSelectionStatus: evaluation.hrStatus,
        updatedAt: new Date(),
      })
      .where(eq(responseTable.id, responseId));

    const existingScreening = await db.query.responseScreening.findFirst({
      where: eq(responseScreening.responseId, responseId),
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
        responseId,
        overallScore: evaluation.priority,
        recommendation: evaluation.recommendation as Recommendation,
        screenedAt: new Date(),
      });
    }

    console.log(
      `[SyncArchived] Отклик ${responseId} успешно повторно обработан`,
    );

    return {
      responseId,
      candidateName: String(normalizedData.candidateName || "Unknown"),
      status: "success",
      screeningResult: {
        overallScore: evaluation.priority,
        recommendation: evaluation.recommendation,
      },
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error(
      `[SyncArchived] Ошибка при повторной обработке отклика ${responseId}:`,
      error,
    );

    return {
      responseId,
      candidateName: "Unknown",
      status: "error",
      error: errorMessage,
    };
  }
}
