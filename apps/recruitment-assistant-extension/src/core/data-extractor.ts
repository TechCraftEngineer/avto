/**
 * Data Extractor
 *
 * Координирует процесс извлечения данных, выбирая подходящий адаптер
 * для текущей платформы (LinkedIn, HeadHunter).
 * Использует те же экземпляры адаптеров, что и resolvePlatform,
 * чтобы getContactsHtml/getSkillsHtml возвращали данные после extraction.
 */

import type { PlatformAdapter } from "../adapters/base/platform-adapter";
import { PLATFORM_ADAPTERS } from "../adapters/registry";
import type { CandidateData } from "../shared/types";

/**
 * Класс для извлечения данных кандидатов с различных платформ
 */
export class DataExtractor {
  private adapters: Map<string, PlatformAdapter>;

  /**
   * Создает экземпляр DataExtractor с общими адаптерами платформ
   */
  constructor() {
    this.adapters = new Map<string, PlatformAdapter>(
      PLATFORM_ADAPTERS.map((a, index) => {
        const base = (
          a as { platformName?: string }
        ).platformName?.toLowerCase();
        const key = base && base.length > 0 ? base : `unknown-${index}`;
        return [key, a];
      }),
    );
  }

  /**
   * Определяет платформу текущей страницы
   *
   * Проверяет каждый зарегистрированный адаптер, чтобы найти тот,
   * который соответствует текущей странице.
   *
   * @returns Адаптер для текущей платформы или null, если платформа не поддерживается
   */
  detectPlatform(): PlatformAdapter | null {
    for (const adapter of this.adapters.values()) {
      if (adapter.isProfilePage()) {
        return adapter;
      }
    }
    return null;
  }

  /**
   * Извлекает данные кандидата с текущей страницы
   *
   * Определяет платформу, выбирает соответствующий адаптер
   * и извлекает все данные профиля.
   *
   * @returns Объект с данными кандидата
   * @throws Error если платформа не поддерживается или извлечение данных не удалось
   */
  async extract(): Promise<CandidateData> {
    const adapter = this.detectPlatform();
    if (!adapter) {
      throw new Error(
        "Неподдерживаемая платформа или страница не является профилем кандидата",
      );
    }

    const adapterKey =
      [...this.adapters.entries()].find(([, a]) => a === adapter)?.[0] ??
      (adapter as { constructor?: { name?: string } }).constructor?.name ??
      "unknown";

    try {
      if (adapter.prepareForExtraction) {
        try {
          await adapter.prepareForExtraction();
        } catch (prepError) {
          console.error(
            `[DataExtractor] prepareForExtraction failed for adapter "${adapterKey}":`,
            prepError,
          );
          // Продолжаем выполнение — base data всё ещё можно извлечь
        }
      }
      const data = adapter.extractAll();
      return data;
    } catch (error) {
      console.error("Ошибка при извлечении данных:", error);
      throw new Error("Не удалось извлечь данные профиля");
    }
  }
}
