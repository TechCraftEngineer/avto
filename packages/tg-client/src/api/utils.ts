import { normalizePhone as normalizePhoneShared } from "@qbs-autonaim/validators";
import type { Context } from "hono";
import type { ZodType } from "zod";

export function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

/**
 * Нормализует телефон к формату хранения (только цифры)
 * @example cleanPhoneNumber('+7 (953) 463-39-45') // '79534633945'
 * @example cleanPhoneNumber('8 953 463 39 45') // '79534633945'
 */
export function cleanPhoneNumber(phone: string): string {
  // Используем libphonenumber-js через shared пакет
  try {
    return normalizePhoneShared(phone);
  } catch {
    // Fallback если shared недоступен
    const digits = phone.trim().replace(/[^\d+]/g, "");
    const onlyDigits = digits.replace(/\D/g, "");

    // Специальная обработка для российских номеров: 8 → 7
    if (onlyDigits.startsWith("8") && onlyDigits.length === 11) {
      return `7${onlyDigits.slice(1)}`;
    }

    return onlyDigits;
  }
}

export function cleanUsername(username: string): string {
  return username.startsWith("@") ? username.slice(1) : username;
}

export function validateRequest<T>(c: Context, schema: ZodType<T>) {
  return async () => {
    const body = await c.req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false as const,
        error: c.json(
          { error: "Invalid request data", details: result.error.issues },
          400,
        ),
      };
    }

    return { success: true as const, data: result.data };
  };
}

export function handleError(error: unknown, defaultMessage: string) {
  console.error(defaultMessage, error);
  return error instanceof Error ? error.message : defaultMessage;
}

export function isAuthError(error: unknown, errorType: string): boolean {
  return error instanceof Error && error.message.includes(errorType);
}
