/**
 * Выбирает правильную форму слова в зависимости от числа (русская плюрализация)
 * @param n - Число
 * @param one - Форма для 1 (например, "день")
 * @param few - Форма для 2-4 (например, "дня")
 * @param many - Форма для 5+ (например, "дней")
 * @returns Правильная форма слова
 * @example
 * pluralize(1, "день", "дня", "дней") // "день"
 * pluralize(2, "день", "дня", "дней") // "дня"
 * pluralize(5, "день", "дня", "дней") // "дней"
 * pluralize(21, "день", "дня", "дней") // "день"
 * pluralize(22, "день", "дня", "дней") // "дня"
 * pluralize(11, "день", "дня", "дней") // "дней"
 */
export function pluralize(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const absN = Math.abs(n);
  const mod10 = absN % 10;
  const mod100 = absN % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return few;
  }

  return many;
}
