/**
 * Кастомная ошибка для случаев отсутствия доступа (403)
 */
export class ForbiddenError extends Error {
  public readonly code = "FORBIDDEN" as const;
  public readonly statusCode = 403;

  constructor(message = "Нет доступа") {
    super(message);
    this.name = "ForbiddenError";

    // Поддержка правильного прототипа для instanceof
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Проверяет, является ли ошибка ошибкой доступа (403)
 */
export function isForbiddenError(error: unknown): error is ForbiddenError {
  if (error instanceof ForbiddenError) {
    return true;
  }

  // Проверка для tRPC ошибок
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "FORBIDDEN"
  ) {
    return true;
  }

  // Fallback на проверку сообщения (для обратной совместимости)
  if (error instanceof Error && error.message?.includes("Нет доступа")) {
    return true;
  }

  return false;
}
