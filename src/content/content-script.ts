/**
 * Content Script для Recruitment Assistant Extension
 *
 * Главный entry point, который запускается на страницах LinkedIn и HeadHunter.
 * Координирует все функции: определение платформы, отображение кнопки,
 * извлечение данных, отображение панели, редактирование, экспорт и импорт.
 */

import type { PlatformAdapter } from "../adapters/base/platform-adapter";
import { HeadHunterAdapter } from "../adapters/headhunter/headhunter-adapter";
import { LinkedInAdapter } from "../adapters/linkedin/linkedin-adapter";
import type { CandidateData } from "../shared/types";

/**
 * Главный класс Content Script
 */
class ContentScript {
  private isInitialized = false;
  private currentData: CandidateData | null = null;
  private currentAdapter: PlatformAdapter | null = null;
  private buttonContainer: HTMLDivElement | null = null;
  private isLoading = false;

  /**
   * Инициализация content script
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log("[Recruitment Assistant] Инициализация content script...");

    try {
      // Проверяем, находимся ли мы на поддерживаемой странице
      const isSupported = await this.checkIfSupportedPage();

      if (isSupported) {
        console.log(
          "[Recruitment Assistant] Поддерживаемая страница обнаружена",
        );
        await this.setupUI();
      } else {
        console.log("[Recruitment Assistant] Страница не поддерживается");
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("[Recruitment Assistant] Ошибка инициализации:", error);
    }
  }

  /**
   * Проверяет, является ли текущая страница поддерживаемой
   * Использует адаптеры платформ для определения
   */
  private async checkIfSupportedPage(): Promise<boolean> {
    const adapters: PlatformAdapter[] = [
      new LinkedInAdapter(),
      new HeadHunterAdapter(),
    ];

    for (const adapter of adapters) {
      if (adapter.isProfilePage()) {
        this.currentAdapter = adapter;
        console.log(
          `[Recruitment Assistant] Обнаружена платформа: ${adapter.platformName}`,
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Настраивает UI элементы на странице
   * Создает и отображает Action Button в течение 2 секунд (Требование 2.3)
   */
  private async setupUI(): Promise<void> {
    console.log("[Recruitment Assistant] Настройка UI...");

    // Создаем контейнер для кнопки
    this.buttonContainer = document.createElement("div");
    this.buttonContainer.id = "recruitment-assistant-action-button";
    this.buttonContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;

    // Создаем кнопку
    const button = this.createActionButton();
    this.buttonContainer.appendChild(button);

    // Добавляем контейнер в DOM
    document.body.appendChild(this.buttonContainer);

    console.log("[Recruitment Assistant] Action Button отображена");
  }

  /**
   * Создает Action Button элемент
   */
  private createActionButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "Извлечь данные профиля кандидата");
    button.setAttribute("aria-busy", "false");
    button.setAttribute("aria-live", "polite");

    // Применяем стили
    this.applyButtonStyles(button, false);

    // Устанавливаем текст
    button.textContent = "Извлечь данные";

    // Добавляем обработчик клика
    button.addEventListener("click", () => this.handleExtractClick());

    // Добавляем обработчики для интерактивности
    this.addButtonInteractivity(button);

    return button;
  }

  /**
   * Применяет стили к кнопке
   */
  private applyButtonStyles(button: HTMLButtonElement, loading: boolean): void {
    const baseStyles = `
      min-width: 44px;
      min-height: 44px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
      color: #ffffff;
      background-color: ${loading ? "#6b7280" : "#2563eb"};
      border: none;
      border-radius: 8px;
      cursor: ${loading ? "not-allowed" : "pointer"};
      touch-action: manipulation;
      -webkit-tap-highlight-color: rgba(37, 99, 235, 0.3);
      transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
      outline: none;
      white-space: nowrap;
    `;

    button.style.cssText = baseStyles;
    button.disabled = loading;
    button.setAttribute("aria-busy", loading.toString());
  }

  /**
   * Добавляет интерактивность к кнопке
   */
  private addButtonInteractivity(button: HTMLButtonElement): void {
    // Проверяем prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    button.addEventListener("mouseenter", () => {
      if (!this.isLoading) {
        button.style.backgroundColor = "#1d4ed8";
        button.style.boxShadow =
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)";
      }
    });

    button.addEventListener("mouseleave", () => {
      if (!this.isLoading) {
        button.style.backgroundColor = "#2563eb";
        button.style.boxShadow =
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)";
      }
    });

    button.addEventListener("mousedown", () => {
      if (!this.isLoading && !prefersReducedMotion) {
        button.style.transform = "scale(0.98)";
      }
    });

    button.addEventListener("mouseup", () => {
      if (!prefersReducedMotion) {
        button.style.transform = "scale(1)";
      }
    });

    button.addEventListener("focus", () => {
      button.style.outline = "2px solid #2563eb";
      button.style.outlineOffset = "2px";
    });

    button.addEventListener("blur", () => {
      button.style.outline = "none";
    });
  }

  /**
   * Обновляет состояние кнопки
   */
  private updateButtonState(loading: boolean): void {
    if (!this.buttonContainer) return;

    const button = this.buttonContainer.querySelector("button");
    if (!button) return;

    this.isLoading = loading;
    this.applyButtonStyles(button, loading);
    button.textContent = loading ? "Извлечение данных…" : "Извлечь данные";
  }

  /**
   * Обрабатывает клик на кнопку извлечения данных
   */
  private async handleExtractClick(): Promise<void> {
    // TODO: Реализовать обработку клика
    // Будет реализовано в задаче 21.3
    console.log(
      "[Recruitment Assistant] Обработка клика на кнопку извлечения...",
    );
  }

  /**
   * Извлекает данные профиля
   */
  private async extractData(): Promise<CandidateData | null> {
    // TODO: Реализовать извлечение данных через DataExtractor
    // Будет реализовано в задаче 21.4
    console.log("[Recruitment Assistant] Извлечение данных...");
    return null;
  }

  /**
   * Отображает панель с данными
   */
  private async showDataPanel(data: CandidateData): Promise<void> {
    // TODO: Реализовать отображение DataPanel
    // Будет реализовано в задаче 21.5
    console.log("[Recruitment Assistant] Отображение панели данных...");
    this.currentData = data;
  }

  /**
   * Обрабатывает редактирование поля
   */
  private handleEdit(field: string, value: unknown): void {
    // TODO: Реализовать редактирование данных
    // Будет реализовано в задаче 21.6
    console.log("[Recruitment Assistant] Редактирование поля:", field, value);
  }

  /**
   * Экспортирует данные в указанном формате
   * Требования 9.1, 9.2, 9.3, 9.4, 9.5
   */
  private async handleExport(format: "json" | "clipboard"): Promise<void> {
    console.log("[Recruitment Assistant] Экспорт данных в формате:", format);

    // Проверяем наличие данных
    if (!this.currentData) {
      this.showNotification({
        type: "error",
        message: "Нет данных для экспорта",
      });
      return;
    }

    try {
      // Валидация данных с использованием Zod v4 (Требование 9.3)
      const { CandidateDataSchema } = await import("../shared/schemas");
      const validatedData = CandidateDataSchema.parse(this.currentData);

      if (format === "json") {
        // Экспорт в JSON файл (Требование 9.1)
        await this.exportToJSON(validatedData);
      } else if (format === "clipboard") {
        // Копирование в буфер обмена (Требование 9.2)
        await this.exportToClipboard(validatedData);
      }

      // Показываем уведомление об успехе на русском языке (Требование 9.4)
      this.showNotification({
        type: "success",
        message:
          format === "json"
            ? "Данные успешно экспортированы в файл"
            : "Данные скопированы в буфер обмена",
      });
    } catch (error) {
      // Показываем сообщение об ошибке на русском языке (Требование 9.5)
      console.error("[Recruitment Assistant] Ошибка экспорта:", error);

      let errorMessage = "Не удалось экспортировать данные";

      if (error instanceof Error) {
        // Проверяем, является ли это ошибкой валидации Zod
        if (error.name === "ZodError") {
          errorMessage = "Данные не прошли проверку перед экспортом";
        } else {
          errorMessage = `Ошибка экспорта: ${error.message}`;
        }
      }

      this.showNotification({
        type: "error",
        message: errorMessage,
      });
    }
  }

  /**
   * Экспортирует данные в JSON файл
   */
  private async exportToJSON(data: CandidateData): Promise<void> {
    // Преобразуем данные в JSON с форматированием
    const jsonString = JSON.stringify(data, null, 2);

    // Создаем Blob с JSON данными
    const blob = new Blob([jsonString], { type: "application/json" });

    // Создаем URL для скачивания
    const url = URL.createObjectURL(blob);

    // Генерируем имя файла на основе имени кандидата и даты
    const fileName = this.generateFileName(data);

    // Создаем временную ссылку для скачивания
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";

    // Добавляем в DOM, кликаем и удаляем
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Освобождаем URL
    URL.revokeObjectURL(url);

    console.log(
      `[Recruitment Assistant] Данные экспортированы в файл: ${fileName}`,
    );
  }

  /**
   * Копирует данные в буфер обмена
   */
  private async exportToClipboard(data: CandidateData): Promise<void> {
    // Преобразуем данные в JSON с форматированием
    const jsonString = JSON.stringify(data, null, 2);

    // Используем Clipboard API для копирования
    await navigator.clipboard.writeText(jsonString);

    console.log("[Recruitment Assistant] Данные скопированы в буфер обмена");
  }

  /**
   * Генерирует имя файла для экспорта
   */
  private generateFileName(data: CandidateData): string {
    // Получаем имя кандидата и очищаем от недопустимых символов
    const name = data.basicInfo.fullName
      .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .toLowerCase();

    // Получаем текущую дату в формате YYYY-MM-DD
    const date = new Date().toISOString().split("T")[0];

    // Формируем имя файла
    return `candidate_${name}_${date}.json`;
  }

  /**
   * Показывает уведомление пользователю
   */
  private showNotification(notification: {
    type: "success" | "error" | "warning" | "info";
    message: string;
  }): void {
    // Создаем контейнер для уведомления
    const container = document.createElement("div");
    container.setAttribute("role", "alert");
    container.setAttribute("aria-live", "polite");
    container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 1000000;
      max-width: 400px;
      padding: 16px 20px;
      background-color: ${this.getNotificationColor(notification.type)};
      color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      animation: slideIn 0.3s ease-out;
    `;

    // Добавляем стили анимации
    if (!document.getElementById("recruitment-assistant-notification-styles")) {
      const style = document.createElement("style");
      style.id = "recruitment-assistant-notification-styles";
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Устанавливаем текст уведомления
    container.textContent = notification.message;

    // Добавляем в DOM
    document.body.appendChild(container);

    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
      container.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Возвращает цвет для уведомления в зависимости от типа
   */
  private getNotificationColor(
    type: "success" | "error" | "warning" | "info",
  ): string {
    switch (type) {
      case "success":
        return "#10b981"; // green-500
      case "error":
        return "#ef4444"; // red-500
      case "warning":
        return "#f59e0b"; // amber-500
      case "info":
        return "#3b82f6"; // blue-500
      default:
        return "#6b7280"; // gray-500
    }
  }

  /**
   * Импортирует данные в систему через API
   * Требования 10.1, 10.2, 10.3, 10.4, 1.9
   */
  private async handleImport(): Promise<void> {
    console.log("[Recruitment Assistant] Импорт данных в систему...");

    // Проверяем наличие данных
    if (!this.currentData) {
      this.showNotification({
        type: "error",
        message: "Нет данных для импорта",
      });
      return;
    }

    try {
      // Получаем настройки из хранилища
      const { StorageManager } = await import("../storage/storage-manager");
      const storageManager = new StorageManager();
      const settings = await storageManager.getSettings();

      // Проверяем, настроен ли API (Требование 10.1)
      if (!settings.apiUrl || !settings.apiToken || !settings.organizationId) {
        this.showNotification({
          type: "error",
          message:
            "API не настроен. Перейдите в настройки расширения для конфигурации.",
        });
        return;
      }

      // Проверяем авторизацию пользователя (Требование 1.9)
      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        this.showNotification({
          type: "error",
          message:
            "Необходима авторизация для импорта данных. Войдите в систему через расширение.",
        });
        return;
      }

      // Показываем индикатор загрузки
      this.showNotification({
        type: "info",
        message: "Импорт данных в систему…",
      });

      // Создаем экземпляр ApiClient и отправляем данные
      const { ApiClient } = await import("../core/api-client");
      const apiClient = new ApiClient(settings);

      // Отправляем данные с токеном аутентификации (Требование 10.2)
      const response = await apiClient.importCandidate(
        this.currentData,
        settings.organizationId,
      );

      // Показываем уведомление об успехе (Требование 10.3)
      this.showNotification({
        type: "success",
        message: `Кандидат успешно импортирован в систему (ID: ${response.candidateId || response.candidateOrganizationId || "неизвестен"})`,
      });

      console.log(
        "[Recruitment Assistant] Данные успешно импортированы:",
        response,
      );
    } catch (error) {
      // Показываем сообщение об ошибке с описанием (Требование 10.4)
      console.error("[Recruitment Assistant] Ошибка импорта:", error);

      let errorMessage = "Не удалось импортировать данные в систему";

      if (error instanceof Error) {
        errorMessage = `Ошибка импорта: ${error.message}`;
      }

      this.showNotification({
        type: "error",
        message: errorMessage,
      });
    }
  }

  /**
   * Проверяет, авторизован ли пользователь и настроен ли API
   * Требование 10.5
   */
  private async checkAuthentication(): Promise<boolean> {
    try {
      // Получаем настройки из хранилища
      const { StorageManager } = await import("../storage/storage-manager");
      const storageManager = new StorageManager();
      const settings = await storageManager.getSettings();

      // Проверяем, настроен ли API
      const isApiConfigured =
        !!settings.apiUrl && !!settings.apiToken && !!settings.organizationId;

      if (!isApiConfigured) {
        console.log(
          "[Recruitment Assistant] API не настроен, импорт недоступен",
        );
        return false;
      }

      // Проверяем авторизацию пользователя
      const result = await chrome.storage.local.get("authToken");
      const isAuthenticated = !!result.authToken;

      console.log(
        `[Recruitment Assistant] Статус авторизации: ${isAuthenticated}`,
      );

      return isAuthenticated;
    } catch (error) {
      console.error(
        "[Recruitment Assistant] Ошибка проверки авторизации:",
        error,
      );
      return false;
    }
  }

  /**
   * Очищает UI элементы при выгрузке
   */
  cleanup(): void {
    console.log("[Recruitment Assistant] Очистка content script...");

    // Удаляем контейнер из DOM
    if (this.buttonContainer?.parentNode) {
      this.buttonContainer.parentNode.removeChild(this.buttonContainer);
      this.buttonContainer = null;
    }

    this.currentData = null;
    this.currentAdapter = null;
    this.isInitialized = false;
  }
}

// Создаем экземпляр и инициализируем
const contentScript = new ContentScript();

// Инициализация при загрузке страницы
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    contentScript.init();
  });
} else {
  // DOM уже загружен
  contentScript.init();
}

// Очистка при выгрузке страницы
window.addEventListener("beforeunload", () => {
  contentScript.cleanup();
});

// Экспортируем для тестирования
export { ContentScript };
