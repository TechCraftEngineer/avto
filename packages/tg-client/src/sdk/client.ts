import { env } from "@qbs-autonaim/config";
import type {
  AuthResponse,
  CheckPasswordInput,
  DownloadFileInput,
  DownloadFileResponse,
  HealthResponse,
  SendCodeInput,
  SendCodeResponse,
  SendMessageByPhoneInput,
  SendMessageByPhoneResponse,
  SendMessageByUsernameInput,
  SendMessageInput,
  SendMessageResponse,
  SignInInput,
} from "../api/schemas";

/**
 * Кастомная ошибка для передачи дополнительных данных
 */
export class TgClientError extends Error {
  constructor(
    message: string,
    public data?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "TgClientError";
  }
}

/**
 * SDK клиент для обращения к Telegram Client API
 */
export class TgClientSDK {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || env.TG_CLIENT_URL || "http://localhost:8001";
  }

  private async request<T>(
    endpoint: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = (await response.json()) as {
        error?: string;
        sessionData?: string;
      };
      throw new TgClientError(error.error || "Request failed", {
        sessionData: error.sessionData,
      });
    }

    return (await response.json()) as T;
  }

  /**
   * Отправить код авторизации на телефон
   */
  async sendCode(params: SendCodeInput): Promise<SendCodeResponse> {
    return this.request("/auth/send-code", params);
  }

  /**
   * Войти с кодом из SMS
   */
  async signIn(params: SignInInput): Promise<AuthResponse> {
    return this.request("/auth/sign-in", params);
  }

  /**
   * Войти с паролем 2FA
   */
  async checkPassword(params: CheckPasswordInput): Promise<AuthResponse> {
    return this.request("/auth/check-password", params);
  }

  /**
   * Отправить сообщение
   */
  async sendMessage(params: SendMessageInput): Promise<SendMessageResponse> {
    return this.request("/messages/send", params);
  }

  /**
   * Отправить сообщение по username
   */
  async sendMessageByUsername(
    params: SendMessageByUsernameInput,
  ): Promise<SendMessageResponse> {
    return this.request("/messages/send-by-username", params);
  }

  /**
   * Отправить сообщение из личного Telegram по username
   */
  async sendPersonalMessageByUsername(params: {
    userId: string;
    username: string;
    text: string;
  }): Promise<SendMessageResponse> {
    return this.request("/messages/send-personal-by-username", params);
  }

  /**
   * Отправить сообщение по телефону
   */
  async sendMessageByPhone(
    params: SendMessageByPhoneInput,
  ): Promise<SendMessageByPhoneResponse> {
    return this.request("/messages/send-by-phone", params);
  }

  /**
   * Скачать файл из сообщения
   */
  async downloadFile(params: DownloadFileInput): Promise<DownloadFileResponse> {
    return this.request("/files/download", params);
  }

  /**
   * Проверить здоровье сервиса
   */
  async health(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    return (await response.json()) as HealthResponse;
  }
}

// Экспортируем singleton instance
export const tgClientSDK: TgClientSDK = new TgClientSDK();
