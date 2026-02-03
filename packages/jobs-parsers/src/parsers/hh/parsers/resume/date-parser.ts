/**
 * Парсит русскую дату в формат Date
 * Пример входных данных: "24 сентября 1987", "24 сентября 1987"
 */
export function parseRussianBirthDate(dateString: string): Date | null {
  if (!dateString) return null;

  const monthMap: Record<string, number> = {
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

  try {
    // Убираем неразрывные пробелы и лишние пробелы
    const normalized = dateString.replace(/\s+/g, " ").trim();

    // Парсим формат "24 сентября 1987"
    const match = normalized.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);

    if (!match || !match[1] || !match[2] || !match[3]) {
      console.warn(`Не удалось распарсить дату рождения: ${dateString}`);
      return null;
    }

    const day = Number.parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    const year = Number.parseInt(match[3], 10);

    const month = monthMap[monthName];

    if (month === undefined) {
      console.warn(`Неизвестный месяц: ${monthName}`);
      return null;
    }

    const date = new Date(year, month, day);

    // Проверяем валидность даты
    if (Number.isNaN(date.getTime())) {
      console.warn(`Невалидная дата: ${dateString}`);
      return null;
    }

    return date;
  } catch (error) {
    console.error(`Ошибка парсинга даты рождения: ${dateString}`, error);
    return null;
  }
}
