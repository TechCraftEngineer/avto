/**
 * Получает инициалы из полного имени
 * @param name - Полное имя (например, "Иван Петров" или "John Doe")
 * @returns Инициалы в верхнем регистре (например, "ИП" или "JD")
 * @example
 * getInitials("Иван Петров") // "ИП"
 * getInitials("John") // "JO"
 * getInitials("") // ""
 */
export function getInitials(name: string): string {
  if (!name || !name.trim()) {
    return "";
  }

  const parts = name.trim().split(/\s+/);

  // Если есть минимум 2 части (имя и фамилия)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  // Если только одно слово, берём первые 2 символа
  return name.slice(0, 2).toUpperCase();
}
