/**
 * Санитизация текста, сгенерированного AI
 * Защита от вредоносного контента перед сохранением в БД и отправкой в Telegram
 */

import { removeNullBytes } from "./utils/sanitize";

/**
 * Удаляет потенциально опасные паттерны из AI-сгенерированного текста
 */
function removeDangerousPatterns(text: string): string {
  let sanitized = text;

  // Удаляем HTML теги
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Удаляем JavaScript протоколы
  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/data:text\/html/gi, "");

  // Удаляем потенциальные SQL injection паттерны
  sanitized = sanitized.replace(
    /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE)\s+/gi,
    "; ",
  );

  // Удаляем попытки command injection
  sanitized = sanitized.replace(/[|&;`$(){}[\]]/g, "");

  return sanitized;
}

/**
 * Фильтрует запрещенные слова и фразы
 */
function filterDisallowedContent(text: string): string {
  let filtered = text;

  // Список запрещенных паттернов (можно расширить по необходимости)
  const disallowedPatterns = [
    // Попытки манипуляции системой
    /\b(hack|exploit|vulnerability|bypass|inject)\b/gi,
    // Оскорбительный контент (базовый список)
    /\b(fuck|shit|damn|bitch|asshole)\b/gi,
  ];

  for (const pattern of disallowedPatterns) {
    filtered = filtered.replace(pattern, (match) => {
      // Заменяем на звездочки той же длины
      return "*".repeat(match.length);
    });
  }

  return filtered;
}

/**
 * Нормализует форматирование текста
 */
function normalizeFormatting(text: string): string {
  let normalized = text;

  // Удаляем множественные пробелы
  normalized = normalized.replace(/[ \t]{2,}/g, " ");

  // Удаляем множественные переносы строк (более 2 подряд)
  normalized = normalized.replace(/\n{3,}/g, "\n\n");

  // Удаляем пробелы в начале и конце строк
  normalized = normalized
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  return normalized.trim();
}

/**
 * Ограничивает длину текста
 */
function limitLength(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Основная функция санитизации AI-сгенерированного текста
 *
 * Применяет следующие преобразования:
 * 1. Удаляет нулевые байты (PostgreSQL не поддерживает)
 * 2. Удаляет управляющие символы
 * 3. Экранирует HTML
 * 4. Удаляет опасные паттерны (скрипты, SQL, команды)
 * 5. Фильтрует запрещенные слова
 * 6. Нормализует форматирование
 * 7. Ограничивает длину
 *
 * @param text - Текст для санитизации
 * @param maxLength - Максимальная длина (по умолчанию 5000)
 * @returns Санитизированный текст
 */
export function sanitizeAiText(
  text: string | null | undefined,
  maxLength = 5000,
): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  let sanitized = text;

  // 1. Удаляем нулевые байты
  sanitized = removeNullBytes(sanitized);

  // 2. Удаляем управляющие символы (кроме переносов строк и табуляции)
  // biome-ignore lint/suspicious/noControlCharactersInRegex: необходимо для санитизации
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Удаляем опасные паттерны
  sanitized = removeDangerousPatterns(sanitized);

  // 4. Фильтруем запрещенный контент
  sanitized = filterDisallowedContent(sanitized);

  // 5. Нормализуем форматирование
  sanitized = normalizeFormatting(sanitized);

  // 6. Ограничиваем длину
  sanitized = limitLength(sanitized, maxLength);

  return sanitized;
}

/**
 * Санитизирует массив строк
 */
export function sanitizeAiTextArray(
  items: string[] | null | undefined,
  maxLength = 1000,
): string[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => sanitizeAiText(item, maxLength))
    .filter((item) => item.length > 0);
}
