/**
 * Утилиты для безопасной работы с датами
 *
 * ВАЖНО: Для календарных дат (дата рождения, дата начала работы и т.д.)
 * всегда используем UTC полночь, чтобы избежать проблем с таймзонами.
 */

/**
 * Парсит дату рождения в UTC полночь
 * Гарантирует, что дата не сдвинется при смене таймзоны сервера
 *
 * @param date - Дата в любом формате (Date, string, number)
 * @returns Date в UTC полночь или null если невалидная
 *
 * @example
 * // Из строки
 * parseBirthDate("1987-09-24") // -> 1987-09-24T00:00:00.000Z
 *
 * // Из Date объекта (нормализует в UTC)
 * parseBirthDate(new Date(1987, 8, 24)) // -> 1987-09-24T00:00:00.000Z
 */
export function parseBirthDate(
  date: Date | string | number | null | undefined,
): Date | null {
  if (!date) return null;

  try {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    // Нормализуем в UTC полночь
    return new Date(
      Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    );
  } catch {
    return null;
  }
}

/**
 * Создаёт дату в UTC полночь из компонентов
 * Используется для парсинга дат из текста
 *
 * @param year - Год (1900-2100)
 * @param month - Месяц (0-11, как в Date)
 * @param day - День (1-31)
 * @returns Date в UTC полночь или null если невалидная
 *
 * @example
 * createUTCDate(1987, 8, 24) // -> 1987-09-24T00:00:00.000Z (сентябрь)
 */
export function createUTCDate(
  year: number,
  month: number,
  day: number,
): Date | null {
  // Валидация диапазонов
  if (year < 1900 || year > 2100) return null;
  if (month < 0 || month > 11) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month, day));

  // Проверяем, что дата валидна (например, 31 февраля станет 3 марта)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Вычисляет возраст на текущую дату
 *
 * @param birthDate - Дата рождения
 * @param referenceDate - Дата относительно которой считать (по умолчанию сегодня)
 * @returns Возраст в годах или null
 *
 * @example
 * calculateAge(new Date("1987-09-24")) // -> 37 (в 2025 году)
 */
export function calculateAge(
  birthDate: Date | null | undefined,
  referenceDate: Date = new Date(),
): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const ref = new Date(referenceDate);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime())) {
    return null;
  }

  let age = ref.getFullYear() - birth.getFullYear();
  const monthDiff = ref.getMonth() - birth.getMonth();

  // Если день рождения ещё не наступил в этом году
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Форматирует дату рождения для отображения
 *
 * @param birthDate - Дата рождения
 * @param locale - Локаль (по умолчанию ru-RU)
 * @returns Отформатированная строка или null
 *
 * @example
 * formatBirthDate(new Date("1987-09-24")) // -> "24 сентября 1987"
 */
export function formatBirthDate(
  birthDate: Date | null | undefined,
  locale: string = "ru-RU",
): string | null {
  if (!birthDate) return null;

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC", // ВАЖНО: используем UTC для календарных дат
  });
}

/**
 * Форматирует дату для input[type="date"]
 *
 * @param date - Дата
 * @returns Строка в формате YYYY-MM-DD или пустая строка
 *
 * @example
 * formatDateForInput(new Date("1987-09-24")) // -> "1987-09-24"
 */
export function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  // Используем UTC компоненты для календарных дат
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Парсит дату из input[type="date"]
 *
 * @param value - Строка в формате YYYY-MM-DD
 * @returns Date в UTC полночь или null
 *
 * @example
 * parseDateFromInput("1987-09-24") // -> 1987-09-24T00:00:00.000Z
 */
export function parseDateFromInput(
  value: string | null | undefined,
): Date | null {
  if (!value) return null;

  // Формат YYYY-MM-DD
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = parseInt(match[1] ?? "", 10);
  const month = parseInt(match[2] ?? "", 10) - 1; // Месяцы с 0
  const day = parseInt(match[3] ?? "", 10);

  return createUTCDate(year, month, day);
}

/**
 * Форматирует дату рождения с возрастом для скрининга резюме
 *
 * @param birthDate - Дата рождения в любом формате
 * @returns Строка "DD MMMM YYYY (возраст: X лет)" или пустая строка
 *
 * @example
 * formatBirthDateWithAge(new Date("1987-09-24")) // -> "24 сентября 1987 (возраст: 37 лет)"
 * formatBirthDateWithAge("1987-09-24") // -> "24 сентября 1987 (возраст: 37 лет)"
 * formatBirthDateWithAge(null) // -> ""
 */
export function formatBirthDateWithAge(
  birthDate: Date | string | null | undefined,
): string {
  if (!birthDate) return "";

  const date = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const formatted = formatBirthDate(date);
  const age = calculateAge(date);

  if (!formatted) return "";

  return `${formatted}${age !== null ? ` (возраст: ${age} лет)` : ""}`;
}
