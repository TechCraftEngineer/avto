/**
 * Unit-тесты для Content Script - Import функциональность
 * Задача 21.8: Реализовать импорт данных в систему через API
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CandidateData } from "../shared/types";

describe("ContentScript - Import функциональность (Task 21.8)", () => {
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
    it("должен успешно импортировать данные кандидата в систему (Требование 10.1)", async () => {
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

    it("должен показать уведомление об успехе (Требование 10.3)", async () => {
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

    it("должен показать ошибку если пользователь не авторизован (Требование 1.9)", async () => {
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
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      // Act
      await contentScript.handleImport();

      // Assert
      expect(showNotificationSpy).toHaveBeenCalledWith({
        type: "error",
        message:
          "Необходима авторизация для импорта данных. Войдите в систему через расширение.",
      });
      expect(global.fetch).not.toHaveBeenCalled();
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
  });
});
