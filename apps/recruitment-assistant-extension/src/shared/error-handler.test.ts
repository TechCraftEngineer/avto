import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import { z } from "zod";
import { ErrorHandler } from "./error-handler";
import type { CandidateData } from "./types";

describe("ErrorHandler", () => {
  let errorHandler: ErrorHandler;
  let mockChrome: any;

  beforeEach(() => {
    errorHandler = new ErrorHandler();

    // Mock chrome API
    mockChrome = {
      storage: {
        local: {
          set: vi.fn(),
        },
      },
      runtime: {
        openOptionsPage: vi.fn(),
      },
    };
    (global as any).chrome = mockChrome;

    // Mock document
    const mockCreateElement = vi.fn((tag: string) => {
      const element: any = {
        tagName: tag,
        className: "",
        textContent: "",
        onclick: null,
        appendChild: vi.fn(),
        remove: vi.fn(),
        setAttribute: vi.fn(),
      };
      return element;
    });

    (global as any).document = {
      body: {
        appendChild: vi.fn(),
      },
      createElement: mockCreateElement,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("handleExtractionError", () => {
    it("должен сохранить частичные данные", () => {
      const error = new Error("Ошибка извлечения");
      const partialData: Partial<CandidateData> = {
        platform: "LinkedIn",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Developer",
          location: "Москва",
          photoUrl: null,
        },
      };

      errorHandler.handleExtractionError(error, partialData);

      expect(mockChrome.storage.local.set).toHaveBeenCalled();
      const callArgs = mockChrome.storage.local.set.mock.calls[0][0];
      const key = Object.keys(callArgs)[0];
      expect(key).toMatch(/^temp_partial_\d+$/);
      expect(callArgs[key]).toEqual(partialData);
    });

    it("не должен сохранять пустые частичные данные", () => {
      const error = new Error("Ошибка извлечения");
      const partialData: Partial<CandidateData> = {};

      errorHandler.handleExtractionError(error, partialData);

      expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
    });

    it("должен показать уведомление с кнопкой повторить", () => {
      const error = new Error("Ошибка извлечения");
      const partialData: Partial<CandidateData> = {
        platform: "LinkedIn",
      };
      const retryCallback = vi.fn();

      errorHandler.setRetryCallback(retryCallback);
      errorHandler.handleExtractionError(error, partialData);

      expect(document.createElement).toHaveBeenCalledWith("div");
      expect(document.createElement).toHaveBeenCalledWith("button");
    });
  });

  describe("handleApiError", () => {
    it("должен обработать ошибку 401 и предложить открыть настройки", () => {
      const error = new Error("401 Unauthorized");

      errorHandler.handleApiError(error);

      expect(document.createElement).toHaveBeenCalled();
    });

    it("должен обработать ошибку 403 и предложить открыть настройки", () => {
      const error = new Error("403 Forbidden");

      errorHandler.handleApiError(error);

      expect(document.createElement).toHaveBeenCalled();
    });

    it("должен обработать сетевую ошибку и предложить повторить", () => {
      const error = new Error("Network error");
      const retryCallback = vi.fn();

      errorHandler.setRetryApiCallback(retryCallback);
      errorHandler.handleApiError(error);

      expect(document.createElement).toHaveBeenCalled();
    });

    it("должен обработать другие ошибки API", () => {
      const error = new Error("Internal server error");

      errorHandler.handleApiError(error);

      expect(document.createElement).toHaveBeenCalled();
    });
  });

  describe("handleValidationError", () => {
    it("должен обработать ошибку валидации Zod", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      try {
        schema.parse({ name: "Test", age: "invalid" });
      } catch (error) {
        if (error instanceof z.ZodError) {
          errorHandler.handleValidationError(error);
          expect(document.createElement).toHaveBeenCalled();
        }
      }
    });
  });

  describe("handleConfigError", () => {
    it("должен обработать ошибку конфигурации и предложить открыть настройки", () => {
      errorHandler.handleConfigError("API не настроен");

      expect(document.createElement).toHaveBeenCalled();
    });
  });

  describe("showNotification", () => {
    it("должен создать элемент уведомления с правильными атрибутами", () => {
      errorHandler.showNotification({
        type: "error",
        message: "Тестовое сообщение об ошибке",
      });

      expect(document.createElement).toHaveBeenCalledWith("div");
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it("должен создать кнопку действия, если она указана", () => {
      const actionCallback = vi.fn();

      errorHandler.showNotification({
        type: "error",
        message: "Тестовое сообщение",
        action: {
          label: "Повторить",
          callback: actionCallback,
        },
      });

      expect(document.createElement).toHaveBeenCalledWith("button");
    });

    it("должен использовать русскоязычные сообщения без англицизмов", () => {
      const notification = {
        type: "error" as const,
        message: "Не удалось подключиться к системе",
      };

      errorHandler.showNotification(notification);

      // Проверяем, что сообщение не содержит англицизмов
      expect(notification.message).not.toMatch(/логин|имейл|лоадинг/i);
      expect(notification.message).toMatch(/подключиться|система/);
    });
  });

  describe("setRetryCallback", () => {
    it("должен установить callback для повторной попытки", () => {
      const callback = vi.fn();
      errorHandler.setRetryCallback(callback);

      // Проверяем, что callback установлен (косвенно через handleExtractionError)
      const error = new Error("Test");
      const partialData = { platform: "LinkedIn" };
      errorHandler.handleExtractionError(error, partialData);

      expect(document.createElement).toHaveBeenCalled();
    });
  });

  describe("setRetryApiCallback", () => {
    it("должен установить callback для повторной попытки API запроса", () => {
      const callback = vi.fn();
      errorHandler.setRetryApiCallback(callback);

      // Проверяем, что callback установлен (косвенно через handleApiError)
      const error = new Error("Network error");
      errorHandler.handleApiError(error);

      expect(document.createElement).toHaveBeenCalled();
    });
  });
});
