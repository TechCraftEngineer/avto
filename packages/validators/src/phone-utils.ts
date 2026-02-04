/**
 * Утилиты для работы с телефонными номерами
 * Использует libphonenumber-js для надёжной обработки международных номеров
 */

import { type CountryCode, parsePhoneNumber } from "libphonenumber-js";

/**
 * Нормализует телефон к формату хранения E.164 (только цифры с кодом страны)
 * Поддерживает международные номера с автоопределением страны
 * @example normalizePhone('+7 (953) 463-39-45') // '79534633945'
 * @example normalizePhone('8 953 463 39 45', 'RU') // '79534633945'
 * @example normalizePhone('+380 50 123 45 67') // '380501234567'
 * @example normalizePhone('+1 (555) 123-4567') // '15551234567'
 */
export function normalizePhone(
  phone: string,
  defaultCountry: CountryCode = "RU",
): string {
  try {
    // Пробуем распарсить с указанной страной по умолчанию
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);

    if (phoneNumber?.isValid()) {
      // Возвращаем в формате E.164 без знака +
      return phoneNumber.number.slice(1);
    }
  } catch {
    // Если не удалось распарсить, пробуем без страны
    try {
      const phoneNumber = parsePhoneNumber(phone);
      if (phoneNumber?.isValid()) {
        return phoneNumber.number.slice(1);
      }
    } catch {
      // Fallback: просто убираем всё кроме цифр
      const digits = phone.replace(/\D/g, "");

      // Специальная обработка для российских номеров: 8 → 7
      if (digits.startsWith("8") && digits.length === 11) {
        return `7${digits.slice(1)}`;
      }

      return digits;
    }
  }

  // Fallback: просто убираем всё кроме цифр
  const digits = phone.replace(/\D/g, "");

  // Специальная обработка для российских номеров: 8 → 7
  if (digits.startsWith("8") && digits.length === 11) {
    return `7${digits.slice(1)}`;
  }

  return digits;
}

/**
 * Форматирует телефон для отображения пользователю в международном формате
 * @example formatPhone('79534633945') // '+7 953 463-39-45'
 * @example formatPhone('380501234567') // '+380 50 123 4567'
 * @example formatPhone('15551234567') // '+1 555 123 4567'
 */
export function formatPhone(
  phone: string,
  defaultCountry: CountryCode = "RU",
): string {
  try {
    // Добавляем + если его нет
    const phoneWithPlus = phone.startsWith("+") ? phone : `+${phone}`;

    const phoneNumber = parsePhoneNumber(phoneWithPlus, defaultCountry);

    if (phoneNumber?.isValid()) {
      // Форматируем в международный формат
      return phoneNumber.formatInternational();
    }
  } catch {
    // Fallback: пробуем без страны
    try {
      const phoneWithPlus = phone.startsWith("+") ? phone : `+${phone}`;
      const phoneNumber = parsePhoneNumber(phoneWithPlus);

      if (phoneNumber?.isValid()) {
        return phoneNumber.formatInternational();
      }
    } catch {
      // Если не удалось распарсить, возвращаем с +
      return phone.startsWith("+") ? phone : `+${phone}`;
    }
  }

  // Fallback
  return phone.startsWith("+") ? phone : `+${phone}`;
}

/**
 * Форматирует телефон для отображения в национальном формате
 * @example formatPhoneNational('79534633945', 'RU') // '953 463-39-45'
 */
export function formatPhoneNational(
  phone: string,
  defaultCountry: CountryCode = "RU",
): string {
  try {
    const phoneWithPlus = phone.startsWith("+") ? phone : `+${phone}`;
    const phoneNumber = parsePhoneNumber(phoneWithPlus, defaultCountry);

    if (phoneNumber?.isValid()) {
      return phoneNumber.formatNational();
    }
  } catch {
    // Fallback
  }

  return phone;
}

/**
 * Валидирует телефонный номер
 */
export function isValidPhone(
  phone: string,
  defaultCountry: CountryCode = "RU",
): boolean {
  try {
    const phoneNumber = parsePhoneNumber(phone, defaultCountry);
    return phoneNumber ? phoneNumber.isValid() : false;
  } catch {
    return false;
  }
}

/**
 * Валидирует российский номер телефона
 */
export function isValidRussianPhone(phone: string): boolean {
  return isValidPhone(phone, "RU");
}

/**
 * Определяет страну по коду телефона
 */
export function getPhoneCountry(
  phone: string,
  defaultCountry: CountryCode = "RU",
): CountryCode | null {
  try {
    const phoneWithPlus = phone.startsWith("+") ? phone : `+${phone}`;
    const phoneNumber = parsePhoneNumber(phoneWithPlus, defaultCountry);

    if (phoneNumber?.isValid()) {
      return phoneNumber.country ?? null;
    }
  } catch {
    // Fallback
  }

  return null;
}

/**
 * Получает тип номера (мобильный, стационарный и т.д.)
 */
export function getPhoneType(
  phone: string,
  defaultCountry: CountryCode = "RU",
): string | null {
  try {
    const phoneWithPlus = phone.startsWith("+") ? phone : `+${phone}`;
    const phoneNumber = parsePhoneNumber(phoneWithPlus, defaultCountry);

    if (phoneNumber?.isValid()) {
      return phoneNumber.getType() ?? null;
    }
  } catch {
    // Fallback
  }

  return null;
}
