/**
 * Сервис для управления авторизацией пользователя.
 * Вход только через «Войти через сайт» (link-ext + extension-token).
 */

export class AuthService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /**
   * Выход из учетной записи
   */
  async logout(): Promise<void> {
    await chrome.storage.local.remove(["authToken", "userData"]);
  }

  /**
   * Проверка авторизации
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return Boolean(token);
  }

  /**
   * Получение токена
   */
  async getToken(): Promise<string | null> {
    const result = await chrome.storage.local.get("authToken");
    const token = result.authToken;
    return typeof token === "string" ? token : null;
  }

  /**
   * Получение данных пользователя
   */
  async getUserData(): Promise<{ id: string; email: string; organizationId?: string } | null> {
    const result = await chrome.storage.local.get("userData");
    const userData = result.userData;
    if (
      !userData ||
      typeof userData !== "object" ||
      typeof (userData as Record<string, unknown>).id !== "string" ||
      typeof (userData as Record<string, unknown>).email !== "string"
    ) {
      return null;
    }
    return userData as { id: string; email: string; organizationId?: string };
  }

  /**
   * Проверка валидности токена
   */
  async validateToken(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.apiUrl}/api/auth/validate`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

}
