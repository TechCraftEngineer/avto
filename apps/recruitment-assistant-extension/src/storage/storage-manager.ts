/**
 * Storage Manager для работы с Chrome Storage API
 * Настройки убраны — только авторизация (authToken, userData в chrome.storage).
 */

import type { CandidateData } from "../shared/types";

/**
 * Класс для управления локальным хранилищем данных в Chrome
 */
export class StorageManager {
  /**
   * Сохраняет данные кандидата в локальное хранилище
   */
  async saveCandidate(data: CandidateData): Promise<void> {
    const key = `candidate_${Date.now()}`;
    await chrome.storage.local.set({ [key]: data });
  }

  /**
   * Очищает временные данные из хранилища
   */
  async clearTemporaryData(): Promise<void> {
    const keys = await chrome.storage.local.get(null);
    const tempKeys = Object.keys(keys).filter((k) => k.startsWith("temp_"));
    await chrome.storage.local.remove(tempKeys);
  }
}
