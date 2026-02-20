/**
 * Сервис парсинга откликов фрилансеров
 *
 * Извлекает структурированные данные из текста откликов с фриланс-платформ.
 * Поддерживает одиночный и массовый парсинг.
 */

import type { ContactInfo } from "@qbs-autonaim/shared/server";

/**
 * Распарсенный отклик фрилансера
 */
export interface ParsedResponse {
  freelancerName: string | null;
  contactInfo: ContactInfo;
  responseText: string;
  confidence: number; // 0-1
}

/**
 * Результат валидации распарсенных данных
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Сервис для парсинга откликов фрилансеров
 */
export class ResponseParser {
  // Regex паттерны для извлечения данных
  private readonly emailPattern =
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

  // Международные форматы телефонов
  private readonly phonePattern =
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;

  // Telegram username (@username)
  private readonly telegramPattern = /@([a-zA-Z0-9_]{5,32})\b/g;

  // Паттерны URL профилей платформ
  private readonly platformPatterns = [
    {
      name: "kwork",
      pattern: /(?:https?:\/\/)?(?:www\.)?kwork\.ru\/user\/[\w-]+/gi,
    },
    {
      name: "fl",
      pattern: /(?:https?:\/\/)?(?:www\.)?fl\.ru\/users\/[\w-]+/gi,
    },
    {
      name: "freelance",
      pattern: /(?:https?:\/\/)?(?:www\.)?freelance\.ru\/users\/[\w-]+/gi,
    },
  ];

  // Разделители для массового парсинга
  private readonly bulkDelimiters = [/\n\n+/, /---+/];

  /**
   * Парсит одиночный отклик фрилансера
   *
   * @param text - Текст отклика
   * @returns Распарсенные данные с оценкой уверенности
   */
  parseSingle(text: string): ParsedResponse {
    const trimmedText = text.trim();

    // Извлекаем контактную информацию
    const contactInfo = this.extractContactInfo(trimmedText);

    // Извлекаем имя фрилансера
    const freelancerName = this.extractFreelancerName(trimmedText);

    // Рассчитываем оценку уверенности
    const confidence = this.calculateConfidence(freelancerName, contactInfo);

    return {
      freelancerName,
      contactInfo,
      responseText: trimmedText,
      confidence,
    };
  }

  /**
   * Парсит множественные отклики из одного текста
   *
   * @param text - Текст с несколькими откликами
   * @returns Массив распарсенных откликов
   */
  parseBulk(text: string): ParsedResponse[] {
    const segments = this.splitBulkText(text);
    return segments
      .map((segment) => this.parseSingle(segment))
      .filter((response) => response.responseText.length > 0);
  }

  /**
   * Валидирует распарсенные данные
   *
   * @param data - Распарсенный отклик
   * @returns Результат валидации с ошибками и предупреждениями
   */
  validateParsedData(data: ParsedResponse): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверка обязательных полей: имя ИЛИ контактная информация
    const hasName = data.freelancerName && data.freelancerName.length > 0;
    const hasContact =
      data.contactInfo.email ||
      data.contactInfo.phone ||
      data.contactInfo.telegram ||
      data.contactInfo.platformProfile;

    if (!hasName && !hasContact) {
      errors.push(
        "Отсутствуют обязательные данные: необходимо указать имя или контактную информацию",
      );
    }

    // Предупреждение о низкой уверенности
    if (data.confidence < 0.7) {
      warnings.push(
        `Низкая уверенность парсинга (${Math.round(data.confidence * 100)}%). Рекомендуется ручная проверка`,
      );
    }

    // Предупреждение об отсутствии имени
    if (!hasName) {
      warnings.push("Имя фрилансера не найдено");
    }

    // Предупреждение об отсутствии контактов
    if (!hasContact) {
      warnings.push("Контактная информация не найдена");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Извлекает контактную информацию из текста
   */
  private extractContactInfo(text: string): ContactInfo {
    const contactInfo: ContactInfo = {};

    // Email
    const emailMatch = text.match(this.emailPattern);
    if (emailMatch && emailMatch.length > 0) {
      contactInfo.email = emailMatch[0];
    }

    // Телефон
    const phoneMatches = text.match(this.phonePattern);
    if (phoneMatches && phoneMatches.length > 0) {
      // Фильтруем слишком короткие совпадения (вероятно, не телефоны)
      const validPhones = phoneMatches.filter((phone) => {
        const digitsOnly = phone.replace(/\D/g, "");
        return digitsOnly.length >= 10;
      });
      if (validPhones.length > 0) {
        contactInfo.phone = validPhones[0];
      }
    }

    // Telegram
    const telegramMatch = text.match(this.telegramPattern);
    if (telegramMatch && telegramMatch.length > 0) {
      contactInfo.telegram = telegramMatch[0];
    }

    // URL профиля на платформе
    for (const { pattern } of this.platformPatterns) {
      const match = text.match(pattern);
      if (match && match.length > 0) {
        contactInfo.platformProfile = match[0];
        break; // Берём первое совпадение
      }
    }

    return contactInfo;
  }

  /**
   * Извлекает имя фрилансера из текста
   * Простая эвристика: первая строка или первые 2-3 слова
   */
  private extractFreelancerName(text: string): string | null {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      return null;
    }

    // Пробуем первую строку
    const firstLine = lines[0]?.trim();

    // Если первая строка короткая (вероятно, имя)
    if (
      firstLine &&
      firstLine.length <= 50 &&
      firstLine.split(" ").length <= 4
    ) {
      // Проверяем, что это не email или URL
      if (!this.emailPattern.test(firstLine) && !firstLine.includes("http")) {
        return firstLine;
      }
    }

    // Пробуем найти паттерн "Имя:" или "Name:"
    const namePattern = /(?:имя|name|фио|ф\.и\.о\.?):\s*(.+)/i;
    const nameMatch = text.match(namePattern);
    if (nameMatch?.[1]) {
      return nameMatch[1].trim();
    }

    return null;
  }

  /**
   * Рассчитывает оценку уверенности на основе извлечённых полей
   * 0 = нет данных, 1 = все поля заполнены
   */
  private calculateConfidence(
    name: string | null,
    contactInfo: ContactInfo,
  ): number {
    let score = 0;
    const maxScore = 5;

    // Имя (вес: 1)
    if (name && name.length > 0) {
      score += 1;
    }

    // Email (вес: 1)
    if (contactInfo.email) {
      score += 1;
    }

    // Телефон (вес: 1)
    if (contactInfo.phone) {
      score += 1;
    }

    // Telegram (вес: 0.5)
    if (contactInfo.telegram) {
      score += 0.5;
    }

    // URL профиля на платформе (вес: 1.5)
    if (contactInfo.platformProfile) {
      score += 1.5;
    }

    return Math.min(score / maxScore, 1);
  }

  /**
   * Разделяет текст массового импорта на отдельные сегменты
   */
  private splitBulkText(text: string): string[] {
    let segments: string[] = [text];

    // Пробуем каждый разделитель
    for (const delimiter of this.bulkDelimiters) {
      const split = text.split(delimiter);
      if (split.length > segments.length) {
        segments = split;
      }
    }

    // Фильтруем пустые сегменты
    return segments
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
  }
}
