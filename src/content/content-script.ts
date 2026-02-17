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
   */
  private async handleExport(format: "json" | "clipboard"): Promise<void> {
    // TODO: Реализовать экспорт данных
    // Будет реализовано в задаче 21.7
    console.log("[Recruitment Assistant] Экспорт данных в формате:", format);
  }

  /**
   * Импортирует данные в систему через API
   */
  private async handleImport(): Promise<void> {
    // TODO: Реализовать импорт в систему
    // Будет реализовано в задаче 21.8
    console.log("[Recruitment Assistant] Импорт данных в систему...");
  }

  /**
   * Проверяет, авторизован ли пользователь
   */
  private async checkAuthentication(): Promise<boolean> {
    // TODO: Реализовать проверку авторизации
    // Будет реализовано в задаче 21.9
    return false;
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
