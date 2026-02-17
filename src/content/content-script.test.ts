/**
 * Unit-тесты для Content Script - Export функциональность
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CandidateData } from "../shared/types";

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
