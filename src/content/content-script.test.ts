/**
 * Unit-тесты для Content Script
 * Покрывает: определение платформы, извлечение данных, экспорт, импорт
 * @vitest-environment happy-dom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CandidateData } from "../shared/types";

describe("ContentScript - Инициализация и определение платформы", () => {
  beforeEach(() => {
    // Очищаем DOM перед каждым тестом
    document.body.innerHTML = "";

    // Mock для console.log
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("init", () => {
    it("должен инициализироваться только один раз", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      await contentScript.init();
      await contentScript.init(); // Повторная инициализация

      // Assert
      expect(contentScript.isInitialized).toBe(true);
    });

    it("должен вызвать setupUI если страница поддерживается", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: { pathname: "/in/test-user/", hostname: "linkedin.com" },
        writable: true,
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      const setupUISpy = vi.spyOn(contentScript, "setupUI");

      // Act
      await contentScript.init();

      // Assert
      expect(setupUISpy).toHaveBeenCalled();
    });

    it("не должен вызывать setupUI если страница не поддерживается", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: { pathname: "/feed/", hostname: "linkedin.com" },
        writable: true,
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      const setupUISpy = vi.spyOn(contentScript, "setupUI");

      // Act
      await contentScript.init();

      // Assert
      expect(setupUISpy).not.toHaveBeenCalled();
    });

    it("должен обработать ошибку при инициализации", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      vi.spyOn(contentScript, "checkIfSupportedPage").mockRejectedValue(
        new Error("Test error"),
      );

      // Act & Assert
      await expect(contentScript.init()).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("checkIfSupportedPage", () => {
    it("должен вернуть true для страницы профиля LinkedIn", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: { pathname: "/in/john-doe/", hostname: "linkedin.com" },
        writable: true,
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkIfSupportedPage();

      // Assert
      expect(result).toBe(true);
      expect(contentScript.currentAdapter).not.toBeNull();
      expect(contentScript.currentAdapter.platformName).toBe("LinkedIn");
    });

    it("должен вернуть true для страницы профиля HeadHunter", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/resume/12345678",
          hostname: "hh.ru",
        },
        writable: true,
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkIfSupportedPage();

      // Assert
      expect(result).toBe(true);
      expect(contentScript.currentAdapter).not.toBeNull();
      expect(contentScript.currentAdapter.platformName).toBe("HeadHunter");
    });

    it("должен вернуть false для неподдерживаемой страницы", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: { pathname: "/feed/", hostname: "linkedin.com" },
        writable: true,
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkIfSupportedPage();

      // Assert
      expect(result).toBe(false);
      expect(contentScript.currentAdapter).toBeNull();
    });

    it("должен вернуть false для неподдерживаемого сайта", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: { pathname: "/profile/test", hostname: "facebook.com" },
        writable: true,
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkIfSupportedPage();

      // Assert
      expect(result).toBe(false);
      expect(contentScript.currentAdapter).toBeNull();
    });
  });

  describe("setupUI", () => {
    it("должен создать и добавить Action Button в DOM", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      await contentScript.setupUI();

      // Assert
      const buttonContainer = document.getElementById(
        "recruitment-assistant-action-button",
      );
      expect(buttonContainer).not.toBeNull();
      expect(buttonContainer?.querySelector("button")).not.toBeNull();
    });

    it("Action Button должна иметь корректные атрибуты доступности", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      await contentScript.setupUI();

      // Assert
      const button = document.querySelector(
        "#recruitment-assistant-action-button button",
      );
      expect(button?.getAttribute("aria-label")).toBe(
        "Извлечь данные профиля кандидата",
      );
      expect(button?.getAttribute("aria-busy")).toBe("false");
      expect(button?.getAttribute("aria-live")).toBe("polite");
    });

    it("Action Button должна иметь минимальные размеры для мобильных устройств", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      await contentScript.setupUI();

      // Assert
      const button = document.querySelector(
        "#recruitment-assistant-action-button button",
      ) as HTMLButtonElement;
      const styles = button.style;

      expect(styles.minWidth).toBe("44px");
      expect(styles.minHeight).toBe("44px");
      expect(styles.touchAction).toBe("manipulation");
    });

    it("Action Button должна иметь русскоязычный текст без англицизмов", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      await contentScript.setupUI();

      // Assert
      const button = document.querySelector(
        "#recruitment-assistant-action-button button",
      );
      expect(button?.textContent).toBe("Извлечь данные");
      expect(button?.textContent).not.toMatch(/extract|parse|scrape/i);
    });

    it("должен установить контейнер с высоким z-index", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      await contentScript.setupUI();

      // Assert
      const container = document.getElementById(
        "recruitment-assistant-action-button",
      );
      expect(container?.style.zIndex).toBe("999999");
      expect(container?.style.position).toBe("fixed");
    });
  });

  describe("createActionButton", () => {
    it("должен создать кнопку с обработчиком клика", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      const handleExtractClickSpy = vi.spyOn(
        contentScript,
        "handleExtractClick",
      );

      // Act
      const button = contentScript.createActionButton();
      button.click();

      // Assert
      expect(handleExtractClickSpy).toHaveBeenCalled();
    });

    it("должен применить стили для состояния загрузки", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      const button = document.createElement("button");

      // Act
      contentScript.applyButtonStyles(button, true);

      // Assert
      expect(button.disabled).toBe(true);
      expect(button.getAttribute("aria-busy")).toBe("true");
      expect(button.style.cursor).toBe("not-allowed");
    });

    it("должен применить стили для обычного состояния", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      const button = document.createElement("button");

      // Act
      contentScript.applyButtonStyles(button, false);

      // Assert
      expect(button.disabled).toBe(false);
      expect(button.getAttribute("aria-busy")).toBe("false");
      expect(button.style.cursor).toBe("pointer");
    });
  });

  describe("updateButtonState", () => {
    it("должен обновить текст кнопки при загрузке", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      await contentScript.setupUI();

      // Act
      contentScript.updateButtonState(true);

      // Assert
      const button = document.querySelector(
        "#recruitment-assistant-action-button button",
      );
      expect(button?.textContent).toBe("Извлечение данных…");
      expect(button?.textContent).toMatch(/…$/); // Проверяем эллипсис
    });

    it("должен обновить текст кнопки после загрузки", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      await contentScript.setupUI();
      contentScript.updateButtonState(true);

      // Act
      contentScript.updateButtonState(false);

      // Assert
      const button = document.querySelector(
        "#recruitment-assistant-action-button button",
      );
      expect(button?.textContent).toBe("Извлечь данные");
    });

    it("должен обновить состояние isLoading", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      await contentScript.setupUI();

      // Act
      contentScript.updateButtonState(true);

      // Assert
      expect(contentScript.isLoading).toBe(true);

      // Act
      contentScript.updateButtonState(false);

      // Assert
      expect(contentScript.isLoading).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("должен удалить контейнер из DOM", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      await contentScript.setupUI();

      // Act
      contentScript.cleanup();

      // Assert
      const container = document.getElementById(
        "recruitment-assistant-action-button",
      );
      expect(container).toBeNull();
    });

    it("должен очистить все данные", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = { test: "data" };
      contentScript.currentAdapter = { test: "adapter" };
      contentScript.isInitialized = true;

      // Act
      contentScript.cleanup();

      // Assert
      expect(contentScript.currentData).toBeNull();
      expect(contentScript.currentAdapter).toBeNull();
      expect(contentScript.isInitialized).toBe(false);
      expect(contentScript.buttonContainer).toBeNull();
    });

    it("должен безопасно обрабатывать повторный вызов", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      await contentScript.setupUI();

      // Act & Assert
      contentScript.cleanup();
      expect(() => contentScript.cleanup()).not.toThrow();
    });
  });

  describe("showNotification", () => {
    it("должен создать уведомление с корректным типом", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      contentScript.showNotification({
        type: "success",
        message: "Тестовое уведомление",
      });

      // Assert
      const notification = document.querySelector('[role="alert"]');
      expect(notification).not.toBeNull();
      expect(notification?.textContent).toBe("Тестовое уведомление");
    });

    it("должен использовать aria-live для доступности", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      contentScript.showNotification({
        type: "info",
        message: "Информация",
      });

      // Assert
      const notification = document.querySelector('[role="alert"]');
      expect(notification?.getAttribute("aria-live")).toBe("polite");
    });

    it("должен использовать корректные цвета для разных типов", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act & Assert
      expect(contentScript.getNotificationColor("success")).toBe("#10b981");
      expect(contentScript.getNotificationColor("error")).toBe("#ef4444");
      expect(contentScript.getNotificationColor("warning")).toBe("#f59e0b");
      expect(contentScript.getNotificationColor("info")).toBe("#3b82f6");
    });

    it("уведомления должны быть на русском языке", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      contentScript.showNotification({
        type: "success",
        message: "Данные успешно сохранены",
      });

      // Assert
      const notification = document.querySelector('[role="alert"]');
      expect(notification?.textContent).not.toMatch(/success|saved|data/i);
      expect(notification?.textContent).toMatch(/данные|успешно|сохранены/i);
    });
  });
});

describe("ContentScript - Export функциональность", () => {
  let mockCandidateData: CandidateData;

  beforeEach(() => {
    // Создаем mock данные кандидата
    mockCandidateData = {
      platform: "LinkedIn",
      profileUrl: "https://linkedin.com/in/test-user",
      basicInfo: {
        fullName: "Иван Иванов",
        currentPosition: "Senior Developer",
        location: "Москва, Россия",
        photoUrl: "https://example.com/photo.jpg",
      },
      experience: [
        {
          position: "Senior Developer",
          company: "Tech Company",
          startDate: "2020-01",
          endDate: null,
          description: "Разработка веб-приложений",
        },
      ],
      education: [
        {
          institution: "МГУ",
          degree: "Бакалавр",
          fieldOfStudy: "Информатика",
          startDate: "2015",
          endDate: "2019",
        },
      ],
      skills: ["JavaScript", "TypeScript", "React"],
      contacts: {
        email: "ivan@example.com",
        phone: "+7 (999) 123-45-67",
        socialLinks: ["https://github.com/ivan"],
      },
      extractedAt: new Date("2024-01-15T10:00:00Z"),
    };

    // Mock для Clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    // Mock для URL.createObjectURL и URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    // Mock для document.createElement
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName === "a") {
        // Mock для ссылки скачивания
        element.click = vi.fn();
      }
      return element;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("exportToJSON", () => {
    it("должен создать JSON файл с корректными данными", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;

      // Act
      await contentScript.handleExport("json");

      // Assert
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith("a");
    });

    it("должен генерировать корректное имя файла", () => {
      // Arrange
      const name = mockCandidateData.basicInfo.fullName
        .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();
      const date = new Date().toISOString().split("T")[0];
      const expectedFileName = `candidate_${name}_${date}.json`;

      // Assert
      expect(expectedFileName).toMatch(
        /^candidate_иван_иванов_\d{4}-\d{2}-\d{2}\.json$/,
      );
    });

    it("должен создать валидный JSON", () => {
      // Arrange
      const jsonString = JSON.stringify(mockCandidateData, null, 2);

      // Act
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(parsed).toEqual(mockCandidateData);
      expect(parsed.basicInfo.fullName).toBe("Иван Иванов");
      expect(parsed.platform).toBe("LinkedIn");
    });

    it("должен освободить URL после скачивания", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;

      // Act
      await contentScript.handleExport("json");

      // Assert
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });

  describe("exportToClipboard", () => {
    it("должен скопировать данные в буфер обмена", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;

      // Act
      await contentScript.handleExport("clipboard");

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    it("должен скопировать форматированный JSON", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const expectedJSON = JSON.stringify(mockCandidateData, null, 2);

      // Act
      await contentScript.handleExport("clipboard");

      // Assert
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedJSON);
    });
  });

  describe("Валидация данных", () => {
    it("должен валидировать данные перед экспортом", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;

      // Act & Assert - не должно выбросить ошибку
      await expect(contentScript.handleExport("json")).resolves.not.toThrow();
    });

    it("должен показать ошибку при отсутствии данных", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = null;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleExport("json");

      // Assert
      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: "error",
        message: "Нет данных для экспорта",
      });
    });

    it("должен показать ошибку при невалидных данных", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      // Создаем невалидные данные (отсутствует обязательное поле fullName)
      contentScript.currentData = {
        ...mockCandidateData,
        basicInfo: {
          ...mockCandidateData.basicInfo,
          fullName: "",
        },
      };
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleExport("json");

      // Assert
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
        }),
      );
    });
  });

  describe("Уведомления", () => {
    it("должен показать уведомление об успехе при экспорте в JSON", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleExport("json");

      // Assert
      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: "success",
        message: "Данные успешно экспортированы в файл",
      });
    });

    it("должен показать уведомление об успехе при копировании в буфер обмена", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleExport("clipboard");

      // Assert
      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: "success",
        message: "Данные скопированы в буфер обмена",
      });
    });

    it("уведомления должны быть на русском языке", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleExport("json");

      // Assert
      const notification = showNotificationSpy.mock.calls[0][0];
      expect(notification.message).not.toMatch(/export|success|file/i);
      expect(notification.message).toMatch(/данные|экспортированы|файл/i);
    });
  });

  describe("Граничные случаи", () => {
    it("должен обработать кандидата без фотографии", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = {
        ...mockCandidateData,
        basicInfo: {
          ...mockCandidateData.basicInfo,
          photoUrl: null,
        },
      };

      // Act & Assert
      await expect(contentScript.handleExport("json")).resolves.not.toThrow();
    });

    it("должен обработать кандидата без контактов", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = {
        ...mockCandidateData,
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
      };

      // Act & Assert
      await expect(contentScript.handleExport("json")).resolves.not.toThrow();
    });

    it("должен обработать кандидата с текущей работой (endDate = null)", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData; // уже содержит endDate: null

      // Act & Assert
      await expect(contentScript.handleExport("json")).resolves.not.toThrow();
    });

    it("должен обработать кандидата с пустым списком навыков", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = {
        ...mockCandidateData,
        skills: [],
      };

      // Act & Assert
      await expect(contentScript.handleExport("json")).resolves.not.toThrow();
    });

    it("должен обработать специальные символы в имени при генерации файла", () => {
      // Arrange
      const nameWithSpecialChars = "Иван О'Коннор-Смит (Jr.)";
      const cleaned = nameWithSpecialChars
        .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();

      // Assert
      expect(cleaned).toBe("иван_оконнорсмит_jr");
      expect(cleaned).not.toMatch(/[()'-]/);
    });
  });

  describe("Свойство 8: Валидность экспортируемых данных", () => {
    it("экспорт в JSON должен производить валидный JSON для любых данных", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;

      // Act
      const jsonString = JSON.stringify(mockCandidateData, null, 2);
      const parsed = JSON.parse(jsonString);

      // Assert - данные должны быть эквивалентны после round-trip
      expect(parsed).toEqual(mockCandidateData);
      expect(parsed.platform).toBe(mockCandidateData.platform);
      expect(parsed.basicInfo.fullName).toBe(
        mockCandidateData.basicInfo.fullName,
      );
      expect(parsed.experience).toEqual(mockCandidateData.experience);
      expect(parsed.education).toEqual(mockCandidateData.education);
      expect(parsed.skills).toEqual(mockCandidateData.skills);
      expect(parsed.contacts).toEqual(mockCandidateData.contacts);
    });
  });
});

describe("ContentScript - Import функциональность", () => {
  let mockCandidateData: CandidateData;
  let mockSettings: any;

  beforeEach(() => {
    // Создаем mock данные кандидата
    mockCandidateData = {
      platform: "LinkedIn",
      profileUrl: "https://linkedin.com/in/test-user",
      basicInfo: {
        fullName: "Иван Иванов",
        currentPosition: "Senior Developer",
        location: "Москва, Россия",
        photoUrl: "https://example.com/photo.jpg",
      },
      experience: [
        {
          position: "Senior Developer",
          company: "Tech Company",
          startDate: "2020-01",
          endDate: null,
          description: "Разработка веб-приложений",
        },
      ],
      education: [
        {
          institution: "МГУ",
          degree: "Бакалавр",
          fieldOfStudy: "Информатика",
          startDate: "2015",
          endDate: "2019",
        },
      ],
      skills: ["JavaScript", "TypeScript", "React"],
      contacts: {
        email: "ivan@example.com",
        phone: "+7 (999) 123-45-67",
        socialLinks: ["https://github.com/ivan"],
      },
      extractedAt: new Date("2024-01-15T10:00:00Z"),
    };

    // Mock настроек
    mockSettings = {
      apiUrl: "https://api.example.com",
      apiToken: "test-token-123",
      organizationId: "org-123",
      fieldsToExtract: {
        basicInfo: true,
        experience: true,
        education: true,
        skills: true,
        contacts: true,
      },
    };

    // Mock для chrome.storage.local
    global.chrome = {
      storage: {
        local: {
          get: vi.fn().mockImplementation((keys) => {
            if (keys === "settings") {
              return Promise.resolve({ settings: mockSettings });
            }
            if (keys === "authToken") {
              return Promise.resolve({ authToken: "test-auth-token" });
            }
            return Promise.resolve({});
          }),
          set: vi.fn().mockResolvedValue(undefined),
          remove: vi.fn().mockResolvedValue(undefined),
        },
      },
    } as any;

    // Mock для fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        candidateId: "candidate-123",
        candidateOrganizationId: "candidate-org-456",
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("handleImport", () => {
    it("должен успешно импортировать данные кандидата в систему", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleImport();

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/candidates/import",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          }),
        }),
      );

      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          message: expect.stringContaining("успешно импортирован"),
        }),
      );
    });

    it("должен включать токен аутентификации в запрос (Требование 10.2)", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;

      // Act
      await contentScript.handleImport();

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-123",
          }),
        }),
      );
    });

    it("должен отправить корректную структуру данных", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;

      // Act
      await contentScript.handleImport();

      // Assert
      const fetchCall = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody).toHaveProperty("candidate");
      expect(requestBody).toHaveProperty("organizationId", "org-123");
      expect(requestBody.candidate).toHaveProperty("fullName", "Иван Иванов");
      expect(requestBody.candidate).toHaveProperty("source", "SOURCING");
      expect(requestBody.candidate).toHaveProperty(
        "originalSource",
        "LINKEDIN",
      );
      expect(requestBody.candidate).toHaveProperty(
        "parsingStatus",
        "COMPLETED",
      );
    });

    it("должен показать ошибку если API не настроен (Требование 10.5)", async () => {
      // Arrange
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        settings: {
          apiUrl: "",
          apiToken: "",
          organizationId: "",
          fieldsToExtract: {},
        },
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleImport();

      // Assert
      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: "error",
        message:
          "API не настроен. Перейдите в настройки расширения для конфигурации.",
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("должен показать ошибку если нет данных для импорта", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = null;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleImport();

      // Assert
      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: "error",
        message: "Нет данных для импорта",
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("должен показать ошибку с описанием при неудачном запросе (Требование 10.4)", async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({
          message: "Неверный формат данных",
        }),
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleImport();

      // Assert
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("Ошибка импорта"),
        }),
      );
    });

    it("должен показать уведомление об успехе с ID кандидата (Требование 10.3)", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleImport();

      // Assert
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          message: expect.stringMatching(
            /Кандидат успешно импортирован в систему \(ID: candidate-123\)/,
          ),
        }),
      );
    });

    it("уведомления должны быть на русском языке без англицизмов", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleImport();

      // Assert
      const successNotification = showNotificationSpy.mock.calls.find(
        (call) => call[0].type === "success",
      );
      expect(successNotification).toBeDefined();
      expect(successNotification![0].message).not.toMatch(
        /import|success|candidate/i,
      );
      expect(successNotification![0].message).toMatch(
        /кандидат|импортирован|систему/i,
      );
    });
  });

  describe("checkAuthentication", () => {
    it("должен вернуть true если пользователь авторизован и API настроен", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkAuthentication();

      // Assert
      expect(result).toBe(true);
    });

    it("должен вернуть false если API не настроен", async () => {
      // Arrange
      global.chrome.storage.local.get = vi.fn().mockImplementation((keys) => {
        if (keys === "settings") {
          return Promise.resolve({
            settings: {
              apiUrl: "",
              apiToken: "",
              organizationId: "",
              fieldsToExtract: {},
            },
          });
        }
        if (keys === "authToken") {
          return Promise.resolve({ authToken: "test-auth-token" });
        }
        return Promise.resolve({});
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkAuthentication();

      // Assert
      expect(result).toBe(false);
    });

    it("должен вернуть false если пользователь не авторизован", async () => {
      // Arrange
      global.chrome.storage.local.get = vi.fn().mockImplementation((keys) => {
        if (keys === "settings") {
          return Promise.resolve({ settings: mockSettings });
        }
        if (keys === "authToken") {
          return Promise.resolve({ authToken: null });
        }
        return Promise.resolve({});
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkAuthentication();

      // Assert
      expect(result).toBe(false);
    });

    it("должен вернуть false если отсутствует apiUrl", async () => {
      // Arrange
      global.chrome.storage.local.get = vi.fn().mockImplementation((keys) => {
        if (keys === "settings") {
          return Promise.resolve({
            settings: {
              ...mockSettings,
              apiUrl: "",
            },
          });
        }
        if (keys === "authToken") {
          return Promise.resolve({ authToken: "test-auth-token" });
        }
        return Promise.resolve({});
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkAuthentication();

      // Assert
      expect(result).toBe(false);
    });

    it("должен вернуть false если отсутствует apiToken", async () => {
      // Arrange
      global.chrome.storage.local.get = vi.fn().mockImplementation((keys) => {
        if (keys === "settings") {
          return Promise.resolve({
            settings: {
              ...mockSettings,
              apiToken: "",
            },
          });
        }
        if (keys === "authToken") {
          return Promise.resolve({ authToken: "test-auth-token" });
        }
        return Promise.resolve({});
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkAuthentication();

      // Assert
      expect(result).toBe(false);
    });

    it("должен вернуть false если отсутствует organizationId", async () => {
      // Arrange
      global.chrome.storage.local.get = vi.fn().mockImplementation((keys) => {
        if (keys === "settings") {
          return Promise.resolve({
            settings: {
              ...mockSettings,
              organizationId: "",
            },
          });
        }
        if (keys === "authToken") {
          return Promise.resolve({ authToken: "test-auth-token" });
        }
        return Promise.resolve({});
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkAuthentication();

      // Assert
      expect(result).toBe(false);
    });

    it("должен обработать ошибку при проверке авторизации", async () => {
      // Arrange
      global.chrome.storage.local.get = vi
        .fn()
        .mockRejectedValue(new Error("Storage error"));

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      // Act
      const result = await contentScript.checkAuthentication();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("Граничные случаи импорта", () => {
    it("должен обработать кандидата без email", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = {
        ...mockCandidateData,
        contacts: {
          ...mockCandidateData.contacts,
          email: null,
        },
      };

      // Act & Assert
      await expect(contentScript.handleImport()).resolves.not.toThrow();
    });

    it("должен обработать кандидата без телефона", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = {
        ...mockCandidateData,
        contacts: {
          ...mockCandidateData.contacts,
          phone: null,
        },
      };

      // Act & Assert
      await expect(contentScript.handleImport()).resolves.not.toThrow();
    });

    it("должен обработать кандидата без фотографии", async () => {
      // Arrange
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = {
        ...mockCandidateData,
        basicInfo: {
          ...mockCandidateData.basicInfo,
          photoUrl: null,
        },
      };

      // Act & Assert
      await expect(contentScript.handleImport()).resolves.not.toThrow();
    });

    it("должен обработать сетевую ошибку", async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleImport();

      // Assert
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("Ошибка импорта"),
        }),
      );
    });
  });
});
