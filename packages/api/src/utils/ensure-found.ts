import { ORPCError } from "@orpc/server";

/**
 * Убеждается, что значение существует. Выбрасывает NOT_FOUND при null/undefined.
 *
 * Используйте вместо паттерна:
 * const x = await find...(); if (!x) throw new ORPCError("NOT_FOUND", ...);
 *
 * @param value - значение (результат findFirst, findUnique и т.д.)
 * @param message - сообщение об ошибке (на русском)
 * @returns value с исключённым null/undefined
 */
export function ensureFound<T>(
  value: T | null | undefined,
  message: string,
): T {
  if (value == null) {
    throw new ORPCError("NOT_FOUND", { message });
  }
  return value;
}
