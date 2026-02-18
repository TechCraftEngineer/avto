/**
 * Валидатор данных кандидата
 */

import { CandidateDataSchema, SettingsSchema } from "../shared/schemas";
import type { CandidateData, Settings } from "../shared/types";

/**
 * Класс для валидации извлеченных данных с использованием Zod v4
 */
export class DataValidator {
  /**
   * Валидирует полные данные кандидата
   * @param data - Данные для валидации
   * @returns Валидированные данные кандидата
   * @throws {z.ZodError} Если данные не соответствуют схеме
   */
  validate(data: unknown): CandidateData {
    return CandidateDataSchema.parse(data);
  }

  /**
   * Валидирует частичные данные кандидата
   * Возвращает валидные части данных даже если полная валидация не прошла
   * @param data - Данные для валидации
   * @returns Частично валидированные данные кандидата
   */
  validatePartial(data: unknown): Partial<CandidateData> {
    const result = CandidateDataSchema.safeParse(data);
    if (result.success) {
      return result.data;
    }

    // Возвращаем частично валидные данные
    return data as Partial<CandidateData>;
  }

  /**
   * Валидирует настройки расширения
   * @param settings - Настройки для валидации
   * @returns Валидированные настройки
   * @throws {z.ZodError} Если настройки не соответствуют схеме
   */
  validateSettings(settings: unknown): Settings {
    return SettingsSchema.parse(settings);
  }
}
