/**
 * Сервис для управления авторизацией пользователя
 */

interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    organizationId: string;
  };
  message?: string;
}

export class AuthService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  /**
   * Авторизация пользователя
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || "Ошибка авторизации",
        };
      }

      const data = await response.json();

      // Сохраняем токен и данные пользователя
      await this.saveAuthData(data.token, data.user);

      return {
        success: true,
        token: data.token,
        user: data.user,
      };
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      return {
        success: false,
        message: "Не удалось подключиться к серверу",
      };
    }
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
  async getUserData(): Promise<any | null> {
    const result = await chrome.storage.local.get("userData");
    return result.userData || null;
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

  private async saveAuthData(token: string, user: any): Promise<void> {
    await chrome.storage.local.set({
      authToken: token,
      userData: user,
    });
  }
}

export type { AuthCredentials, AuthResponse };
