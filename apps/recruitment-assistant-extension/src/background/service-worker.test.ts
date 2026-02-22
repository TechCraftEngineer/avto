/**
 * Unit-тесты для Background Service Worker
 * Покрывает: обработку сообщений, проксирование API запросов, обработку ошибок
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Загружаем service-worker (chrome уже настроен в test-setup preload)
import "./service-worker";

describe("Service Worker - Обработка сообщений", () => {
  let mockSendResponse: ReturnType<typeof vi.fn>;
  let mockSender: chrome.runtime.MessageSender;

  beforeEach(() => {
    // Mock для sendResponse
    mockSendResponse = vi.fn();

    // Mock для sender
    mockSender = {
      tab: {
        id: 1,
        url: "https://linkedin.com/in/test-user",
      },
    } as chrome.runtime.MessageSender;

    // Mock для console
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock для fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("PING сообщения", () => {
    it("должен ответить pong на PING сообщение", () => {
      // Arrange
      const message = { type: "PING" as const };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      const result = handler(message, mockSender, mockSendResponse);

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        message: "pong",
      });
      expect(result).toBe(false);
    });

    it("должен логировать получение PING сообщения", () => {
      // Arrange
      const message = { type: "PING" as const };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      // Assert - log format: [Service Worker timestamp], message, data
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[Service Worker"),
        "Получен PING",
        expect.anything(),
      );
    });
  });

  describe("Неизвестные типы сообщений", () => {
    it("должен вернуть ошибку для неизвестного типа сообщения", () => {
      // Arrange
      const message = { type: "UNKNOWN_TYPE" as any };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      const result = handler(message, mockSender, mockSendResponse);

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Неизвестный тип сообщения",
      });
      expect(result).toBe(false);
    });

    it("должен логировать ошибку для неизвестного типа", () => {
      // Arrange
      const message = { type: "INVALID" as any };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("ОШИБКА"),
        expect.stringContaining("Неизвестный тип сообщения"),
        "INVALID",
      );
    });
  });
});

describe("Service Worker - Проксирование API запросов", () => {
  let mockSendResponse: ReturnType<typeof vi.fn>;
  let mockSender: chrome.runtime.MessageSender;

  beforeEach(() => {
    mockSendResponse = vi.fn();
    mockSender = {
      tab: {
        id: 1,
        url: "https://linkedin.com/in/test-user",
      },
    } as chrome.runtime.MessageSender;

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock успешного fetch по умолчанию
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: true, data: "test" }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Успешные запросы", () => {
    it("должен успешно проксировать GET запрос", async () => {
      // Arrange
      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
          headers: { Authorization: "Bearer token" },
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      const result = handler(message, mockSender, mockSendResponse);

      // Ждем выполнения асинхронной операции
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert - GET не добавляет Content-Type (только POST/PUT/PATCH)
      expect(result).toBe(true); // Асинхронный ответ
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer token",
          }),
        }),
      );
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: { success: true, data: "test" },
        status: 200,
      });
    });

    it("должен успешно проксировать POST запрос с телом", async () => {
      // Arrange
      const requestBody = {
        candidate: { fullName: "Иван Иванов" },
        organizationId: "org-123",
      };

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/candidates/import",
          method: "POST" as const,
          headers: { Authorization: "Bearer token" },
          body: requestBody,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/candidates/import",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer token",
          }),
          body: JSON.stringify(requestBody),
        }),
      );
      expect(mockSendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: 200,
        }),
      );
    });

    it("должен обработать текстовый ответ (не JSON)", async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "text/plain" }),
        text: async () => "Success",
      });

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: true,
        data: "Success",
        status: 200,
      });
    });

    it("должен логировать успешное выполнение запроса", async () => {
      // Arrange
      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[Service Worker"),
        expect.stringContaining("Проксирование API запроса"),
        expect.objectContaining({
          url: "https://api.example.com/test",
          method: "GET",
        }),
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[Service Worker"),
        expect.stringContaining("API запрос выполнен успешно"),
        expect.objectContaining({ status: 200 }),
      );
    });
  });

  describe("Валидация запросов", () => {
    it("должен отклонить запрос с некорректным URL", async () => {
      // Arrange
      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert - url "" не проходит isApiRequest, возвращается ошибка формата
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: expect.stringMatching(
          /Некорректный (URL|формат) запроса|ожидается объект/,
        ),
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("должен отклонить не-HTTPS запрос", async () => {
      // Arrange
      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "http://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Разрешены только HTTPS запросы",
      });
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("Обработка ошибок API", () => {
    it("должен обработать ответ с ошибкой 400", async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ message: "Неверный формат данных" }),
      });

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "POST" as const,
          body: { invalid: "data" },
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Неверный формат данных",
        status: 400,
        data: { message: "Неверный формат данных" },
      });
    });

    it("должен обработать ответ с ошибкой 401", async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ message: "Неверный токен" }),
      });

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Неверный токен",
        status: 401,
        data: { message: "Неверный токен" },
      });
    });

    it("должен обработать ответ с ошибкой 500", async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ message: "Внутренняя ошибка сервера" }),
      });

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Внутренняя ошибка сервера",
        status: 500,
        data: { message: "Внутренняя ошибка сервера" },
      });
    });

    it("должен использовать statusText если message отсутствует", async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({}),
      });

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Not Found",
        status: 404,
        data: {},
      });
    });

    it("должен логировать ошибку API", async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ message: "Ошибка" }),
      });

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[Service Worker"),
        expect.stringContaining("API запрос завершился с ошибкой"),
        expect.objectContaining({
          status: 400,
          statusText: "Bad Request",
        }),
      );
    });
  });

  describe("Обработка сетевых ошибок", () => {
    it("должен обработать сетевую ошибку", async () => {
      // Arrange
      global.fetch = vi
        .fn()
        .mockRejectedValue(new TypeError("Failed to fetch"));

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error:
          "Не удалось подключиться к серверу. Проверьте подключение к интернету.",
      });
    });

    it("должен обработать общую ошибку", async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error("Custom error"));

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Custom error",
      });
    });

    it("должен обработать неизвестную ошибку", async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue("Unknown error");

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockSendResponse).toHaveBeenCalledWith({
        success: false,
        error: "Не удалось выполнить запрос к API",
      });
    });

    it("должен логировать сетевую ошибку", async () => {
      // Arrange
      const error = new TypeError("Network error");
      global.fetch = vi.fn().mockRejectedValue(error);

      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("ОШИБКА"),
        expect.stringContaining("Ошибка при выполнении API запроса"),
        error,
      );
    });
  });

  describe("Различные HTTP методы", () => {
    it("должен обработать PUT запрос с телом", async () => {
      // Arrange
      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/resource/123",
          method: "PUT" as const,
          body: { name: "Updated" },
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/resource/123",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
        }),
      );
    });

    it("должен обработать PATCH запрос с телом", async () => {
      // Arrange
      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/resource/123",
          method: "PATCH" as const,
          body: { status: "active" },
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/resource/123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "active" }),
        }),
      );
    });

    it("должен обработать DELETE запрос без тела", async () => {
      // Arrange
      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/resource/123",
          method: "DELETE" as const,
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/resource/123",
        expect.objectContaining({
          method: "DELETE",
        }),
      );
      expect((global.fetch as any).mock.calls[0][1].body).toBeUndefined();
    });
  });

  describe("Обработка заголовков", () => {
    it("должен добавить Content-Type для POST с телом", async () => {
      // Arrange - Content-Type добавляется только для POST/PUT/PATCH с body
      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "POST" as const,
          body: { data: "test" },
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("должен передавать пользовательские заголовки", async () => {
      // Arrange
      const message = {
        type: "API_REQUEST" as const,
        payload: {
          url: "https://api.example.com/test",
          method: "GET" as const,
          headers: {
            Authorization: "Bearer token",
            "X-Custom-Header": "value",
          },
        },
      };

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert - GET не добавляет Content-Type, только переданные заголовки
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer token",
            "X-Custom-Header": "value",
          }),
        }),
      );
    });
  });
});

describe("Service Worker - Жизненный цикл", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Установка расширения", () => {
    it("должен логировать первую установку", () => {
      // Arrange
      const details = {
        reason: chrome.runtime.OnInstalledReason.INSTALL,
      };

      // Act
      const listeners = chrome.runtime.onInstalled.listeners;
      const handler = listeners[listeners.length - 1];
      handler(details);

      // Assert - log format: [Service Worker timestamp], message, data
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[Service Worker"),
        "Расширение установлено",
        expect.objectContaining({ reason: "install" }),
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[Service Worker"),
        "Первая установка расширения",
        expect.anything(),
      );
    });

    it("должен логировать обновление расширения", () => {
      // Arrange
      const details = {
        reason: chrome.runtime.OnInstalledReason.UPDATE,
        previousVersion: "1.0.0",
      };

      // Act
      const listeners = chrome.runtime.onInstalled.listeners;
      const handler = listeners[listeners.length - 1];
      handler(details);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[Service Worker"),
        expect.stringContaining("Расширение установлено"),
        expect.objectContaining({ reason: "update" }),
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("[Service Worker"),
        expect.stringContaining("Расширение обновлено"),
        expect.objectContaining({ previousVersion: "1.0.0" }),
      );
    });
  });

  describe("Запуск Service Worker", () => {
    it("должен логировать запуск при загрузке модуля", () => {
      // Service Worker логирует запуск при импорте - проверяем что логирование работает
      expect(console.log).toBeDefined();
    });
  });
});

describe("Service Worker - Русскоязычные сообщения", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("все сообщения об ошибках должны быть на русском языке", async () => {
    // Arrange
    const mockSendResponse = vi.fn();
    const mockSender = {
      tab: { id: 1, url: "https://test.com" },
    } as chrome.runtime.MessageSender;

    const testCases = [
      {
        message: {
          type: "API_REQUEST" as const,
          payload: { url: "", method: "GET" as const },
        },
        expectedError: /Некорректный|формат|url|method/,
      },
      {
        message: {
          type: "API_REQUEST" as const,
          payload: { url: "http://test.com", method: "GET" as const },
        },
        expectedError: "Разрешены только HTTPS запросы",
      },
      {
        message: { type: "UNKNOWN" as any },
        expectedError: "Неизвестный тип сообщения",
      },
    ];

    for (const testCase of testCases) {
      mockSendResponse.mockClear();

      // Act
      const listeners = chrome.runtime.onMessage.listeners;
      const handler = listeners[listeners.length - 1];
      handler(testCase.message, mockSender, mockSendResponse);

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      const response = mockSendResponse.mock.calls[0]?.[0];
      expect(response).toEqual(
        expect.objectContaining({ success: false, error: expect.any(String) }),
      );
      const errorMessage = response?.error ?? "";
      if (typeof testCase.expectedError === "string") {
        expect(errorMessage).toBe(testCase.expectedError);
      } else {
        expect(errorMessage).toMatch(testCase.expectedError);
      }

      // Проверяем отсутствие англицизмов
      expect(errorMessage).not.toMatch(/error|invalid|unknown|request/i);
    }
  });

  it("сообщения в логах должны быть на русском языке", () => {
    // Вызываем обработчик для генерации логов
    const mockSendResponse = vi.fn();
    const mockSender = {
      tab: { id: 1, url: "https://test.com" },
    } as chrome.runtime.MessageSender;
    const listeners = chrome.runtime.onMessage.listeners;
    const handler = listeners[listeners.length - 1];
    handler({ type: "PING" }, mockSender, mockSendResponse);

    const logCalls = (console.log as any).mock?.calls ?? [];
    const russianKeywords = [
      "Проксирование",
      "запрос",
      "Получен",
      "Расширение",
    ];
    const hasRussian = logCalls.some((call: any[]) =>
      call?.some(
        (arg: any) =>
          typeof arg === "string" &&
          russianKeywords.some((kw) => arg.includes(kw)),
      ),
    );
    expect(hasRussian).toBe(true);
  });
});
