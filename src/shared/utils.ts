/**
 * Вспомогательные функции для Recruitment Assistant Extension
 */

import type { ExperienceEntry } from "./types";

/**
 * Извлекает имя из полного имени
 * @param fullName - Полное имя
 * @returns Имя
 */
export function extractFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || "";
}

/**
 * Извлекает фамилию из полного имени
 * @param fullName - Полное имя
 * @returns Фамилия
 */
export function extractLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

/**
 * Вычисляет общий опыт работы в годах
 * @param experience - Массив записей об опыте работы
 * @returns Количество лет опыта
 */
export function calculateExperienceYears(
  experience: ExperienceEntry[],
): number {
  if (experience.length === 0) return 0;

  const totalMonths = experience.reduce((sum, entry) => {
    const start = new Date(entry.startDate);
    const end = entry.endDate ? new Date(entry.endDate) : new Date();
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return sum + Math.max(0, months);
  }, 0);

  return Math.floor(totalMonths / 12);
}

/**
 * Преобразует название платформы в формат для API
 * @param platform - Название платформы
 * @returns Формат для API
 */
export function mapPlatformToSource(
  platform: string,
): "LINKEDIN" | "HEADHUNTER" {
  const platformLower = platform.toLowerCase();
  if (platformLower.includes("linkedin")) return "LINKEDIN";
  if (platformLower.includes("headhunter") || platformLower.includes("hh"))
    return "HEADHUNTER";
  return "LINKEDIN"; // По умолчанию
}

/**
 * Форматирует дату по русским стандартам
 * @param date - Дата для форматирования
 * @returns Отформатированная строка даты
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Форматирует число по русским стандартам
 * @param num - Число для форматирования
 * @returns Отформатированная строка числа
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("ru-RU").format(num);
}

/**
 * Парсит диапазон дат из строки
 * @param dateRange - Строка с диапазоном дат
 * @returns Кортеж [начало, конец]
 */
export function parseDateRange(dateRange: string): [string, string | null] {
  const separators = ["–", "—", "-"];
  let parts: string[] = [];

  for (const separator of separators) {
    if (dateRange.includes(separator)) {
      parts = dateRange.split(separator).map((p) => p.trim());
      break;
    }
  }

  if (parts.length === 0) {
    parts = [dateRange.trim()];
  }

  const startDate = parts[0] || "";
  const endDate = parts[1]?.toLowerCase().includes("настоящ")
    ? null
    : parts[1] || null;

  return [startDate, endDate];
}

/**
 * Проверяет, является ли строка валидным URL
 * @param str - Строка для проверки
 * @returns true, если строка является валидным URL
 */
export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Очищает текст от лишних пробелов и переносов строк
 * @param text - Текст для очистки
 * @returns Очищенный текст
 */
export function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Безопасно извлекает текст из элемента DOM
 * @param element - DOM элемент
 * @returns Текст элемента или пустая строка
 */
export function safeGetText(element: Element | null): string {
  return element?.textContent?.trim() || "";
}

/**
 * Безопасно извлекает атрибут из элемента DOM
 * @param element - DOM элемент
 * @param attribute - Название атрибута
 * @returns Значение атрибута или null
 */
export function safeGetAttribute(
  element: Element | null,
  attribute: string,
): string | null {
  return element?.getAttribute(attribute) || null;
}

/**
 * Создает задержку (для использования с async/await)
 * @param ms - Количество миллисекунд
 * @returns Promise, который разрешается через указанное время
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Копирует текст в буфер обмена
 * @param text - Текст для копирования
 * @returns Promise с результатом операции
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Ошибка копирования в буфер обмена:", error);
    return false;
  }
}

/**
 * Скачивает данные как JSON файл
 * @param data - Данные для скачивания
 * @param filename - Имя файла
 */
export function downloadAsJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Генерирует уникальный идентификатор
 * @returns Уникальный идентификатор
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Проверяет, является ли значение пустым
 * @param value - Значение для проверки
 * @returns true, если значение пустое
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Дебаунс функции
 * @param func - Функция для дебаунса
 * @param wait - Время ожидания в миллисекундах
 * @returns Дебаунснутая функция
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Троттлинг функции
 * @param func - Функция для троттлинга
 * @param limit - Минимальный интервал между вызовами в миллисекундах
 * @returns Троттлнутая функция
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
