/**
 * Ошибка авторизации HH.ru
 */
export class HHAuthError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "MISSING_CREDENTIALS"
      | "INVALID_AUTH_METHOD"
      | "LOGIN_FAILED"
      | "PASSWORD_AUTH_UNAVAILABLE",
  ) {
    super(message);
    this.name = "HHAuthError";
  }
}

/**
 * Проверяет наличие email в credentials
 */
export function validateCredentials(credentials: {
  email?: string;
  password?: string;
}): void {
  if (!credentials.email) {
    throw new HHAuthError(
      "Не указан email для авторизации в HH.ru",
      "MISSING_CREDENTIALS",
    );
  }
}
