/**
 * Этап импорта откликов из HH.ru
 */

import { runHHArchivedVacancyParser } from "@qbs-autonaim/jobs-parsers";
import type { SyncExecutionContext } from "./context";

const THROTTLE_INTERVAL = 1000;

export interface ImportResult {
  syncedResponses: number;
  newResponses: number;
}

/**
 * Импортирует отклики из HH.ru с отслеживанием прогресса
 */
export async function importResponsesFromHH(
  context: SyncExecutionContext,
  params: {
    workspaceId: string;
    vacancyId: string;
    externalId: string | null;
  },
): Promise<ImportResult> {
  let lastProgressUpdate = 0;

  const onParserProgress = async (
    processed: number,
    total: number,
    newCount: number,
    currentName?: string,
  ) => {
    const now = Date.now();
    if (now - lastProgressUpdate < THROTTLE_INTERVAL && processed < total) {
      return;
    }
    lastProgressUpdate = now;

    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    await context.updateProgress({
      processedResponses: processed,
      totalResponses: total,
      newResponses: newCount,
      percentage,
      currentItem: currentName,
      message: `Импорт: ${processed}/${total} (${percentage}%)`,
    });
  };

  const result = await runHHArchivedVacancyParser({
    workspaceId: params.workspaceId,
    vacancyId: params.vacancyId,
    externalId: params.externalId,
    onProgress: onParserProgress,
  });

  return {
    syncedResponses: result.syncedResponses,
    newResponses: result.newResponses,
  };
}
