import type { z } from "zod";
import { Logger } from "./logger";
import type { CandidateData, Notification } from "./types";

/**
 * Обработчик ошибок для расширения
 * Обрабатывает все типы ошибок с русскоязычными сообщениями
 */
export class ErrorHandler {
  private logger: Logger;
  private retryCallback?: () => void;
  private retryApiCallback?: () => void;

  constructor() {
    this.logger = new Logger();
  }

  /**
   * Устанавливает callback для повторной попытки извлечения данных
   */
  setRetryCallback(callback: () => void): void {
    this.retryCallback = callback;
  }

  /**
   * Устанавливает callback для повторной попытки API запроса
   */
  setRetryApiCallback(callback: () => void): void {
    this.retryApiCallback = callback;
  }

  /**
   * Обрабатывает ошибки извлечения данных с сохранением частичных данных
   */
  handleExtractionError(
    error: Error,
    partialData: Partial<CandidateData>,
  ): void {
    this.logger.log(error, "extraction", { partialData });

    // Сохраняем частичные данные, если они есть
    if (Object.keys(partialData).length > 0) {
      this.savePartialData(partialData);
    }

    // Показываем уведомление пользователю
    this.showNotification({
      type: "error",
      message:
        "Не удалось извлечь некоторые данные. Структура страницы могла измениться.",
      action: this.retryCallback
        ? {
            label: "Повторить",
            callback: this.retryCallback,
          }
        : undefined,
    });
  }

  /**
   * Обрабатывает ошибки API с обработкой 401/403/network ошибок
   */
  handleApiError(error: Error): void {
    this.logger.log(error, "api");

    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes("401") || errorMessage.includes("403")) {
      // Ошибка аутентификации
      this.showNotification({
        type: "error",
        message:
          "Ошибка аутентификации. Проверьте настройки API в параметрах расширения.",
        action: {
          label: "Открыть настройки",
          callback: () => chrome.runtime.openOptionsPage(),
        },
      });
    } else if (
      errorMessage.includes("network") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("подключ")
    ) {
      // Сетевая ошибка
      this.showNotification({
        type: "error",
        message:
          "Не удалось подключиться к системе. Проверьте подключение к интернету.",
        action: this.retryApiCallback
          ? {
              label: "Повторить",
              callback: this.retryApiCallback,
            }
          : undefined,
      });
    } else {
      // Другие ошибки API
      this.showNotification({
        type: "error",
        message: `Ошибка отправки данных: ${error.message}`,
      });
    }
  }

  /**
   * Обрабатывает ошибки валидации Zod
   */
  handleValidationError(error: z.ZodError): void {
    this.logger.log(
      new Error(`Ошибка валидации: ${error.message}`),
      "validation",
      { issues: error.issues },
    );

    this.showNotification({
      type: "warning",
      message:
        "Данные не прошли проверку. Некоторые поля могут быть недоступны.",
    });
  }

  /**
   * Обрабатывает ошибки конфигурации
   */
  handleConfigError(message: string): void {
    this.logger.log(new Error(message), "config");

    this.showNotification({
      type: "error",
      message:
        "API не настроен. Перейдите в настройки расширения для конфигурации.",
      action: {
        label: "Открыть настройки",
        callback: () => chrome.runtime.openOptionsPage(),
      },
    });
  }

  /**
   * Отображает уведомление пользователю
   */
  showNotification(notification: Notification): void {
    // Создаем элемент уведомления
    const notificationElement = document.createElement("div");
    notificationElement.className = `ra-notification ra-notification--${notification.type}`;
    notificationElement.setAttribute("role", "alert");
    notificationElement.setAttribute("aria-live", "polite");

    // Добавляем сообщение
    const messageElement = document.createElement("div");
    messageElement.className = "ra-notification__message";
    messageElement.textContent = notification.message;
    notificationElement.appendChild(messageElement);

    // Добавляем кнопку действия, если есть
    if (notification.action) {
      const actionButton = document.createElement("button");
      actionButton.className = "ra-notification__action";
      actionButton.textContent = notification.action.label;
      actionButton.onclick = () => {
        notification.action?.callback?.();
        notificationElement.remove();
      };
      notificationElement.appendChild(actionButton);
    }

    // Добавляем кнопку закрытия
    const closeButton = document.createElement("button");
    closeButton.className = "ra-notification__close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Закрыть уведомление");
    closeButton.onclick = () => notificationElement.remove();
    notificationElement.appendChild(closeButton);

    // Добавляем уведомление в DOM
    document.body.appendChild(notificationElement);

    // Автоматически удаляем уведомление через 10 секунд
    setTimeout(() => {
      if (notificationElement.parentElement) {
        notificationElement.remove();
      }
    }, 10000);
  }

  /**
   * Сохраняет частичные данные во временное хранилище
   */
  private savePartialData(partialData: Partial<CandidateData>): void {
    try {
      const key = `temp_partial_${Date.now()}`;
      chrome.storage.local.set({ [key]: partialData });
      console.log("Частичные данные сохранены:", key);
    } catch (error) {
      console.error("Не удалось сохранить частичные данные:", error);
    }
  }
}
