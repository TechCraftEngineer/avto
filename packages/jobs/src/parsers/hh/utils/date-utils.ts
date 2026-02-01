/**
 * Парсит дату отклика из строки в различных форматах
 * Поддерживает форматы:
 * - "сегодня в 14:30"
 * - "вчера в 10:15"
 * - "5 февраля в 09:45"
 * - "5 февраля 2023 в 09:45"
 * - "5 февраля" (архивные вакансии)
 */
export function parseResponseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;

  const currentYear = new Date().getFullYear();
  const months: Record<string, number> = {
    января: 0,
    февраля: 1,
    марта: 2,
    апреля: 3,
    мая: 4,
    июня: 5,
    июля: 6,
    августа: 7,
    сентября: 8,
    октября: 9,
    ноября: 10,
    декабря: 11,
  };

  // Формат: "сегодня в 14:30", "вчера в 10:15"
  if (dateStr.includes("сегодня")) {
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const [, hours, minutes] = timeMatch;
      const date = new Date();
      date.setHours(
        parseInt(hours || "0", 10),
        parseInt(minutes || "0", 10),
        0,
        0,
      );
      return date;
    }
  } else if (dateStr.includes("вчера")) {
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const [, hours, minutes] = timeMatch;
      const date = new Date();
      date.setDate(date.getDate() - 1);
      date.setHours(
        parseInt(hours || "0", 10),
        parseInt(minutes || "0", 10),
        0,
        0,
      );
      return date;
    }
  }

  // Формат: "5 февраля в 09:45" или "5 февраля 2023 в 09:45"
  const timeMatch = dateStr.match(
    /(\d{1,2})\s+(\w+)\s*(?:(\d{4}))?\s*(?:в\s+(\d{1,2}):(\d{2}))?/,
  );
  if (timeMatch) {
    const [, day, monthName, year, hours, minutes] = timeMatch;
    const month = months[monthName?.toLowerCase() || ""];

    if (month !== undefined && day) {
      const targetYear = year ? parseInt(year, 10) : currentYear;
      const date = new Date(targetYear, month, parseInt(day, 10));

      // Если указано время, устанавливаем его
      if (hours && minutes) {
        date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }

      // Для архивных вакансий: если дата в будущем, значит это прошлого года
      if (!hours && !minutes && date > new Date()) {
        date.setFullYear(date.getFullYear() - 1);
      }

      return date;
    }
  }

  // Простой формат для архивных вакансий: "5 февраля"
  const simpleMatch = dateStr.match(/(\d+)\s+(\S+)/);
  if (simpleMatch) {
    const [, day, monthName] = simpleMatch;
    const month = months[monthName?.toLowerCase() || ""];

    if (month !== undefined && day) {
      const parsed = new Date(currentYear, month, parseInt(day, 10));
      const now = new Date();

      // Если распарсенная дата находится в будущем, значит это дата прошлого года
      if (parsed > now) {
        parsed.setFullYear(parsed.getFullYear() - 1);
      }

      return parsed;
    }
  }

  return undefined;
}
