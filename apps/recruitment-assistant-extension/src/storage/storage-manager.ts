/**
 * Storage Manager для работы с Chrome Storage API
 */

import type { CandidateData, Settings } from "../shared/types";

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
   * Получает настройки из хранилища
   */
  async getSettings(): Promise<Settings> {
    const result = await chrome.storage.local.get("settings");
    return result.settings || this.getDefaultSettings();
  }

  /**
   * Сохраняет настройки в хранилище
   */
  async saveSettings(settings: Settings): Promise<void> {
    await chrome.storage.local.set({ settings });
  }

  /**
   * Очищает временные данные из хранилища
   */
  async clearTemporaryData(): Promise<void> {
    const keys = await chrome.storage.local.get(null);
    const tempKeys = Object.keys(keys).filter((k) => k.startsWith("temp_"));
    await chrome.storage.local.remove(tempKeys);
  }

  /**
   * Возвращает настройки по умолчанию
   */
  getDefaultSettings(): Settings {
    return {
      apiUrl: "",
      apiToken: "",
      organizationId: "",
      fieldsToExtract: {
        basicInfo: true,
        experience: true,
        education: true,
        skills: true,
        contacts: true,
      },
    };
  }
}
