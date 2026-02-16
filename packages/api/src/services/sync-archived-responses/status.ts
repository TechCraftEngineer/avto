/**
 * Статус и отмена синхронизации
 */

import type { SyncResult } from "./types";

/**
 * Получить текущий статус синхронизации (placeholder для real-time tracking)
 */
export async function getSyncStatus(_vacancyId: string): Promise<{
  isRunning: boolean;
  lastSyncAt: Date | null;
  lastResult: SyncResult | null;
} | null> {
  // В реальной реализации здесь был бы доступ к кэшу или базе данных
  return null;
}

/**
 * Отменить текущую синхронизацию
 */
export async function cancelSync(vacancyId: string): Promise<boolean> {
  console.log(
    `[SyncArchived] Запрос на отмену синхронизации для вакансии ${vacancyId}`,
  );
  return true;
}
