import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { screenResponse, unwrap } from "./response";

export interface ScreenNewResponsesProgress {
  processed: number;
  failed: number;
  total: number;
}

export interface ScreenNewResponsesOptions {
  onProgress?: (progress: ScreenNewResponsesProgress) => void | Promise<void>;
}

export interface ScreenNewResponsesResult {
  processed: number;
  failed: number;
  total: number;
}

/**
 * Собирает отклики без скрининга и оценивает их.
 * Используется в screen-new и sync-archived-responses.
 */
const vacancyIdSchema = z.string().min(1);

export async function screenNewResponsesForVacancy(
  vacancyId: string,
  options: ScreenNewResponsesOptions = {},
): Promise<ScreenNewResponsesResult> {
  vacancyIdSchema.parse(vacancyId);

  const { onProgress } = options;

  const allResponses = await db.query.response.findMany({
    where: and(
      eq(response.entityType, "vacancy"),
      eq(response.entityId, vacancyId),
    ),
    columns: { id: true, entityId: true },
  });

  if (allResponses.length === 0) {
    return { processed: 0, failed: 0, total: 0 };
  }

  const screenedIds = new Set(
    (
      await db.query.responseScreening.findMany({
        where: (screening, { inArray }) =>
          inArray(screening.responseId, allResponses.map((r) => r.id)),
        columns: { responseId: true },
      })
    ).map((s) => s.responseId),
  );

  const toScreen = allResponses.filter((r) => !screenedIds.has(r.id));
  if (toScreen.length === 0) {
    return { processed: 0, failed: 0, total: 0 };
  }

  await onProgress?.({
    processed: 0,
    failed: 0,
    total: toScreen.length,
  });

  let processed = 0;
  let failed = 0;

  for (const resp of toScreen) {
    try {
      const resultWrapper = await screenResponse(resp.id);
      unwrap(resultWrapper);
      processed++;
    } catch (error) {
      console.error(`❌ Ошибка скрининга для ${resp.id}:`, error);
      failed++;
    }

    await onProgress?.({
      processed,
      failed,
      total: toScreen.length,
    });
  }

  return { processed, failed, total: toScreen.length };
}
