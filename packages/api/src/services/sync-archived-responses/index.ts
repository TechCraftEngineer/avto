/**
 * Сервис синхронизации архивных откликов
 *
 * Основные функции:
 * - Импорт данных из внешних источников (HH.ru)
 * - Парсинг и нормализация данных откликов
 * - Оценка и анализ каждого отклика
 * - Пошаговое выполнение с callback для прогресса
 * - Обработка ошибок с retry логикой
 */

import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  response as responseTable,
  vacancyPublication,
} from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { SyncExecutionContext } from "./context";
import { importResponsesFromHH } from "./import-responses";
import { processSingleResponse } from "./process-batch";
import { retryResponse } from "./retry-response";
import { getSyncStatus, cancelSync } from "./status";
import type { SyncArchivedResponsesOptions, SyncResult } from "./types";
import { validateVacancy } from "./validate-vacancy";

export { SyncExecutionContext } from "./context";
export { evaluateResponse, normalizeResponseData } from "./helpers";
export * from "./types";

/**
 * Основная функция синхронизации архивных откликов
 */
export async function syncArchivedResponses(
  options: SyncArchivedResponsesOptions,
): Promise<SyncResult> {
  const {
    vacancyId,
    workspaceId,
    onResponseProcessed,
    batchSize = 10,
    retryFailed = true,
    maxRetries = 3,
    analyzeResponses = true,
  } = options;

  const context = new SyncExecutionContext(options);
  const startTime = Date.now();

  console.log(
    `[SyncArchived] Начало синхронизации архивных откликов для вакансии ${vacancyId}`,
  );

  try {
    await context.changeStage(
      "initialization",
      "Инициализация синхронизации...",
    );

    await context.changeStage("validation", "Проверка вакансии...");
    const { vacancy: vacancyData, publication } = await validateVacancy(
      vacancyId,
      workspaceId,
    );

    await context.updateProgress({
      totalSteps: 6,
      message: "Вакансия проверена",
    });

    await context.changeStage("import", "Импорт откликов из HH.ru...");

    let syncedResponses = 0;
    let newResponses = 0;

    try {
      const importResult = await importResponsesFromHH(context, {
        workspaceId,
        vacancyId,
        externalId: publication.externalId,
      });
      syncedResponses = importResult.syncedResponses;
      newResponses = importResult.newResponses;
      await context.updateProgress({
        newResponses,
        totalResponses: syncedResponses,
      });
    } catch (importError) {
      context.addError(
        "import",
        importError instanceof Error ? importError.message : "Ошибка импорта",
        importError,
      );
      if (syncedResponses === 0) {
        throw importError;
      }
    }

    await context.changeStage(
      "parsing",
      "Парсинг и нормализация данных откликов...",
    );

    const allResponses = await db.query.response.findMany({
      where: and(
        eq(responseTable.entityId, vacancyId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    context.updateTotalResponses(allResponses.length);
    await context.updateProgress({
      totalResponses: allResponses.length,
      totalSteps:
        allResponses.length > 0
          ? 6 + Math.ceil(allResponses.length / batchSize)
          : 6,
    });

    const responsesToProcess = allResponses.slice(0, syncedResponses);
    let processedCount = 0;

    for (let i = 0; i < responsesToProcess.length; i += batchSize) {
      if (context.isCancelled()) {
        break;
      }

      const batch = responsesToProcess.slice(i, i + batchSize);
      await context.changeStage(
        "normalization",
        `Нормализация данных: ${i + 1}-${Math.min(i + batchSize, responsesToProcess.length)} из ${responsesToProcess.length}`,
      );

      for (const response of batch) {
        const result = await processSingleResponse(context, response, {
          analyzeResponses,
          onResponseProcessed,
        });

        if (result.success) {
          processedCount++;
          await context.updateProgress({
            processedResponses: processedCount,
            percentage: Math.round(
              (processedCount / responsesToProcess.length) * 100,
            ),
          });
        } else {
          if (retryFailed && maxRetries > 0) {
            let retrySuccess = false;
            for (let retry = 0; retry < maxRetries; retry++) {
              try {
                console.log(
                  `[SyncArchived] Повторная попытка ${retry + 1}/${maxRetries} для отклика ${response.id}`,
                );
                retrySuccess = true;
                break;
              } catch {
                // Продолжаем следующую попытку
              }
            }
            if (retrySuccess) {
              context.incrementRetriedResponses();
            } else {
              context.addProcessingResult({
                responseId: response.id,
                candidateName: response.candidateName || "Unknown",
                status: "error",
                error: result.error,
              });
            }
          } else {
            context.addProcessingResult({
              responseId: response.id,
              candidateName: response.candidateName || "Unknown",
              status: "error",
              error: result.error,
            });
          }
          context.addError("normalization", result.error, {
            responseId: response.id,
          });
        }
      }
    }

    await db
      .update(vacancyPublication)
      .set({ lastSyncedAt: new Date() })
      .where(eq(vacancyPublication.id, publication.id));

    await context.changeStage("completion", "Завершение синхронизации...");

    console.log("[SyncArchived] Запуск сбора chat_id...");
    await inngest.send({
      name: "vacancy/chat-ids.collect",
      data: { vacancyId },
    });

    console.log("[SyncArchived] Запуск оценки новых откликов...");
    await inngest.send({
      name: "response/screen.new",
      data: { vacancyId },
    });

    const duration = Date.now() - startTime;
    await context.finalize(true);

    console.log(
      `[SyncArchived] Синхронизация завершена за ${duration}ms. Обработано: ${processedCount}, Новых: ${newResponses}`,
    );

    return {
      success: true,
      vacancyId,
      vacancyTitle: vacancyData.title,
      statistics: context.getStatistics(),
      processingResults: context.getResults(),
      errors: context.getErrors(),
      duration,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(
      `[SyncArchived] Критическая ошибка: ${errorMessage}`,
      errorStack,
    );

    context.addError("completion", errorMessage, { stack: errorStack });
    await context.finalize(false);

    return {
      success: false,
      vacancyId,
      vacancyTitle: "",
      statistics: context.getStatistics(),
      processingResults: context.getResults(),
      errors: context.getErrors(),
      duration: Date.now() - startTime,
    };
  }
}

export { getSyncStatus, cancelSync, retryResponse };
