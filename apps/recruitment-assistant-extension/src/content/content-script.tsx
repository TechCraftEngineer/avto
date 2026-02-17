/**
 * Content Script для Recruitment Assistant Extension
 *
 * Главный entry point, который запускается на страницах LinkedIn и HeadHunter.
 * Координирует все функции: определение платформы, отображение кнопки,
 * извлечение данных, отображение панели, редактирование, экспорт и импорт.
 */

import React from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import type { PlatformAdapter } from "../adapters/base/platform-adapter";
import { HeadHunterAdapter } from "../adapters/headhunter/headhunter-adapter";
import { LinkedInAdapter } from "../adapters/linkedin/linkedin-adapter";
import { DataExtractor } from "../core/data-extractor";
import type { CandidateData } from "../shared/types";
import { DataPanel } from "./ui/data-panel";

/**
 * Главный класс Content Script
 */
export class ContentScript {
  private isInitialized = false;
  private currentData: CandidateData | null = null;
  private currentAdapter: PlatformAdapter | null = null;
  private buttonContainer: HTMLDivElement | null = null;
  private panelContainer: HTMLDivElement | null = null;
  private panelRoot: Root | null = null;
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
    const backgroundColor = loading ? "#6b7280" : "#2563eb";
    const cursor = loading ? "not-allowed" : "pointer";

    button.style.cssText = `
      min-width: 44px;
      min-height: 44px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
      color: #ffffff;
      background-color: ${backgroundColor};
      border: none;
      border-radius: 8px;
      cursor: ${cursor};
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
   * Отображает сообщение об ошибке пользователю
   * Требование 11: Понятные сообщения об ошибках на русском языке
   */
  private showError(message: string): void {
    console.error("[Recruitment Assistant] Ошибка:", message);

    // Создаем контейнер для уведомления
    const notification = document.createElement("div");
    notification.setAttribute("role", "alert");
    notification.setAttribute("aria-live", "assertive");
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 1000000;
      max-width: 400px;
      padding: 16px 20px;
      background-color: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #991b1b;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    `;

    // Добавляем иконку ошибки
    const icon = document.createElement("span");
    icon.textContent = "⚠️";
    icon.style.cssText = `
      flex-shrink: 0;
      font-size: 20px;
    `;

    // Добавляем текст сообщения
    const messageText = document.createElement("span");
    messageText.textContent = message;
    messageText.style.cssText = `
      flex: 1;
    `;

    // Добавляем кнопку закрытия
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", "Закрыть уведомление");
    closeButton.style.cssText = `
      flex-shrink: 0;
      background: none;
      border: none;
      color: #991b1b;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    `;

    closeButton.addEventListener("mouseenter", () => {
      closeButton.style.backgroundColor = "rgba(153, 27, 27, 0.1)";
    });

    closeButton.addEventListener("mouseleave", () => {
      closeButton.style.backgroundColor = "transparent";
    });

    closeButton.addEventListener("click", () => {
      notification.remove();
    });

    // Собираем уведомление
    notification.appendChild(icon);
    notification.appendChild(messageText);
    notification.appendChild(closeButton);

    // Добавляем в DOM
    document.body.appendChild(notification);

    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Обрабатывает клик на кнопку извлечения данных
   * Требование 11: Обработка ошибок с понятными сообщениями
   */
  private async handleExtractClick(): Promise<void> {
    // Предотвращаем повторные клики во время загрузки
    if (this.isLoading) {
      return;
    }

    console.log(
      "[Recruitment Assistant] Обработка клика на кнопку извлечения...",
    );

    try {
      // Показываем состояние загрузки
      this.updateButtonState(true);

      // Извлекаем данные профиля
      const data = await this.extractData();

      if (data) {
        console.log("[Recruitment Assistant] Данные успешно извлечены");
        // Отображаем панель с данными (будет реализовано в 21.5)
        await this.showDataPanel(data);
      } else {
        // Данные не были извлечены
        this.showError(
          "Не удалось извлечь данные профиля. Попробуйте обновить страницу.",
        );
      }
    } catch (error) {
      // Обработка ошибок согласно Требованию 11
      console.error("[Recruitment Assistant] Ошибка извлечения данных:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Произошла неизвестная ошибка при извлечении данных";

      this.showError(errorMessage);
    } finally {
      // Возвращаем кнопку в нормальное состояние
      this.updateButtonState(false);
    }
  }

  /**
   * Извлекает данные профиля через DataExtractor
   * Использует текущий адаптер для извлечения данных
   * Обрабатывает частичное извлечение данных (Требование 11.3)
   */
  private async extractData(): Promise<CandidateData | null> {
    console.log("[Recruitment Assistant] Извлечение данных...");

    try {
      // Создаем экземпляр DataExtractor
      const extractor = new DataExtractor();

      // Извлекаем данные через DataExtractor
      // DataExtractor автоматически определит платформу и использует соответствующий адаптер
      const data = await extractor.extract();

      console.log("[Recruitment Assistant] Данные успешно извлечены:", data);
      return data;
    } catch (error) {
      console.error(
        "[Recruitment Assistant] Ошибка при извлечении данных:",
        error,
      );

      // Требование 11.3: Сохранение частично извлеченных данных при ошибке
      // Если произошла ошибка, пытаемся получить частичные данные
      if (this.currentAdapter) {
        try {
          console.log(
            "[Recruitment Assistant] Попытка извлечь частичные данные...",
          );

          // Пытаемся извлечь хотя бы базовую информацию
          const partialData: Partial<CandidateData> = {
            platform: this.currentAdapter.platformName,
            profileUrl: window.location.href,
            extractedAt: new Date(),
          };

          // Пытаемся извлечь базовую информацию
          try {
            partialData.basicInfo = this.currentAdapter.extractBasicInfo();
          } catch (e) {
            console.warn(
              "[Recruitment Assistant] Не удалось извлечь базовую информацию:",
              e,
            );
          }

          // Пытаемся извлечь опыт работы
          try {
            partialData.experience = this.currentAdapter.extractExperience();
          } catch (e) {
            console.warn(
              "[Recruitment Assistant] Не удалось извлечь опыт работы:",
              e,
            );
          }

          // Пытаемся извлечь образование
          try {
            partialData.education = this.currentAdapter.extractEducation();
          } catch (e) {
            console.warn(
              "[Recruitment Assistant] Не удалось извлечь образование:",
              e,
            );
          }

          // Пытаемся извлечь навыки
          try {
            partialData.skills = this.currentAdapter.extractSkills();
          } catch (e) {
            console.warn(
              "[Recruitment Assistant] Не удалось извлечь навыки:",
              e,
            );
          }

          // Пытаемся извлечь контакты
          try {
            partialData.contacts = this.currentAdapter.extractContacts();
          } catch (e) {
            console.warn(
              "[Recruitment Assistant] Не удалось извлечь контакты:",
              e,
            );
          }

          // Проверяем, есть ли хоть какие-то данные
          if (
            partialData.basicInfo ||
            partialData.experience ||
            partialData.education ||
            partialData.skills ||
            partialData.contacts
          ) {
            console.log(
              "[Recruitment Assistant] Частичные данные извлечены:",
              partialData,
            );

            // Возвращаем частичные данные как CandidateData
            // Заполняем отсутствующие поля значениями по умолчанию
            return {
              platform: partialData.platform || "Unknown",
              profileUrl: partialData.profileUrl || window.location.href,
              basicInfo: partialData.basicInfo || {
                fullName: "",
                currentPosition: "",
                location: "",
                photoUrl: null,
              },
              experience: partialData.experience || [],
              education: partialData.education || [],
              skills: partialData.skills || [],
              contacts: partialData.contacts || {
                email: null,
                phone: null,
                socialLinks: [],
              },
              extractedAt: partialData.extractedAt || new Date(),
            };
          }
        } catch (partialError) {
          console.error(
            "[Recruitment Assistant] Не удалось извлечь даже частичные данные:",
            partialError,
          );
        }
      }

      // Если не удалось извлечь даже частичные данные, пробрасываем ошибку
      throw error;
    }
  }

  /**
   * Отображает панель с данными
   * Требование 8: Отображение извлеченных данных в структурированном виде
   */
  private async showDataPanel(data: CandidateData): Promise<void> {
    console.log("[Recruitment Assistant] Отображение панели данных...");
    this.currentData = data;

    // Проверяем, настроен ли API
    const apiConfigured = await this.checkApiConfiguration();

    // Если панель уже существует, обновляем её
    if (this.panelContainer && this.panelRoot) {
      this.renderDataPanel(data, apiConfigured);
      return;
    }

    // Создаем контейнер для панели
    this.panelContainer = document.createElement("div");
    this.panelContainer.id = "recruitment-assistant-data-panel";
    this.panelContainer.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;

    // Добавляем контейнер в DOM
    document.body.appendChild(this.panelContainer);

    // Создаем React root и рендерим панель
    this.panelRoot = createRoot(this.panelContainer);
    this.renderDataPanel(data, apiConfigured);

    console.log("[Recruitment Assistant] Панель данных отображена");
  }

  /**
   * Рендерит DataPanel компонент
   */
  private renderDataPanel(data: CandidateData, apiConfigured: boolean): void {
    if (!this.panelRoot) return;

    this.panelRoot.render(
      <DataPanel
        data={data}
        onEdit={(field, value) => this.handleEdit(field, value)}
        onExport={(format) => this.handleExport(format)}
        onImportToSystem={() => this.handleImport()}
        apiConfigured={apiConfigured}
      />,
    );
  }

  /**
   * Проверяет, настроен ли API для импорта
   */
  private async checkApiConfiguration(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get("settings");
      const settings = result.settings;

      if (!settings) {
        return false;
      }

      // Проверяем, что все необходимые поля заполнены
      return !!(
        settings.apiUrl &&
        settings.apiToken &&
        settings.organizationId
      );
    } catch (error) {
      console.error(
        "[Recruitment Assistant] Ошибка проверки конфигурации API:",
        error,
      );
      return false;
    }
  }

  /**
   * Обрабатывает редактирование поля
   * Поддерживает редактирование вложенных полей (например, "basicInfo.fullName", "experience.0.position")
   * Требование 8.5: Возможность редактирования полей перед экспортом
   */
  private handleEdit(field: string, value: unknown): void {
    if (!this.currentData) {
      console.warn("[Recruitment Assistant] Нет данных для редактирования");
      return;
    }

    console.log("[Recruitment Assistant] Редактирование поля:", field, value);

    try {
      // Создаем копию текущих данных для изменения
      const updatedData = { ...this.currentData };

      // Разбираем путь к полю (например, "basicInfo.fullName" или "experience.0.position")
      const fieldPath = field.split(".");

      // Обновляем значение по пути
      this.setNestedValue(updatedData, fieldPath, value);

      // Сохраняем обновленные данные
      this.currentData = updatedData;

      // Перерисовываем панель с обновленными данными
      this.checkApiConfiguration().then((apiConfigured) => {
        this.renderDataPanel(updatedData, apiConfigured);
      });

      console.log(
        "[Recruitment Assistant] Поле успешно обновлено:",
        field,
        value,
      );
    } catch (error) {
      console.error(
        "[Recruitment Assistant] Ошибка при редактировании поля:",
        error,
      );
      this.showError(
        "Не удалось обновить поле. Попробуйте еще раз или обновите страницу.",
      );
    }
  }

  /**
   * Устанавливает значение по вложенному пути в объекте
   * Поддерживает пути вида "basicInfo.fullName" и "experience.0.position"
   */
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string[],
    value: unknown,
  ): void {
    if (path.length === 0) {
      return;
    }

    // Если это последний элемент пути, устанавливаем значение
    if (path.length === 1) {
      obj[path[0]] = value;
      return;
    }

    // Получаем текущий ключ
    const currentKey = path[0];
    const remainingPath = path.slice(1);

    // Проверяем, является ли следующий ключ числом (индекс массива)
    const nextKey = remainingPath[0];
    const isArrayIndex = !Number.isNaN(Number.parseInt(nextKey, 10));

    // Если текущее значение не существует или не является объектом/массивом, создаем его
    if (!obj[currentKey] || typeof obj[currentKey] !== "object") {
      obj[currentKey] = isArrayIndex ? [] : {};
    }

    // Рекурсивно обновляем вложенное значение
    this.setNestedValue(
      obj[currentKey] as Record<string, unknown>,
      remainingPath,
      value,
    );
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

    // Размонтируем React компонент
    if (this.panelRoot) {
      this.panelRoot.unmount();
      this.panelRoot = null;
    }

    // Удаляем контейнер панели из DOM
    if (this.panelContainer?.parentNode) {
      this.panelContainer.parentNode.removeChild(this.panelContainer);
      this.panelContainer = null;
    }

    // Удаляем контейнер кнопки из DOM
    if (this.buttonContainer?.parentNode) {
      this.buttonContainer.parentNode.removeChild(this.buttonContainer);
      this.buttonContainer = null;
    }

    this.currentData = null;
    this.currentAdapter = null;
    this.isInitialized = false;
  }
}

// Создаем экземпляр и инициализируем только если не в тестовом окружении
if (typeof process === "undefined" || process.env.NODE_ENV !== "test") {
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
}
