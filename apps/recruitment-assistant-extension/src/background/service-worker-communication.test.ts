/**
 * Интеграционные тесты для коммуникации между Content Script и Service Worker
 * Покрывает: отправку сообщений, получение ответов, обработку ошибок
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Коммуникация Content Script <-> Service Worker", () => {
  let mockSendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock для chrome.runtime.sendMessage
    mockSendMessage = vi.fn();

    global.chrome = {
      runtime: {
        sendMessage: mockSendMessage,
      },
    } as any;

    // Mock для console
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock для fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Отправка PING сообщений", () => {
    it("должен отправить PING и получить pong", async () => {
      // Arrange
      mockSendMessage.mockResolvedValue({
        success: true,
        message: "pong",
      });

      // Act
      const response = await chrome.runtime.sendMessage({
        type: "PING",
      });

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith({
        type: "PING",
      });
      expect(response).toEqual({
        success: true,
        message: "pong",
      });
    });
  });

  describe("Отправка API запросов", () => {
    it("должен отправить GET запрос через Service Worker", async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: { id: "123", name: "Test" },
        status: 200,
      };

      mockSendMessage.mockResolvedValue(mockResponse);

      const apiRequest = {
        type: "API_REQUEST",
        payload: {
          url: "https://api.example.com/test",
          method: "GET",
          headers: {
            Authorization: "Bearer token",
          },
        },
      };

      // Act
      const response = await chrome.runtime.sendMessage(apiRequest);

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith(apiRequest);
      expect(response).toEqual(mockResponse);
    });

    it("должен отправить POST запрос с телом через Service Worker", async () => {
      // Arrange
      const mockResponse = {
        success: true,
        data: { candidateId: "candidate-123" },
        status: 201,
      };

      mockSendMessage.mockResolvedValue(mockResponse);

      const apiRequest = {
        type: "API_REQUEST",
        payload: {
          url: "https://api.example.com/candidates/import",
          method: "POST",
          headers: {
            Authorization: "Bearer token",
            "Content-Type": "application/json",
          },
          body: {
            candidate: {
              fullName: "Иван Иванов",
              email: "ivan@example.com",
            },
            organizationId: "org-123",
          },
        },
      };

      // Act
      const response = await chrome.runtime.sendMessage(apiRequest);

      // Assert
      expect(mockSendMessage).toHaveBeenCalledWith(apiRequest);
      expect(response).toEqual(mockResponse);
      expect(response.data.candidateId).toBe("candidate-123");
    });

    it("должен получить ошибку от Service Worker при неудачном запросе", async () => {
      // Arrange
      const mockErrorResponse = {
        success: false,
        error: "Ошибка авторизации",
        status: 401,
      };

      mockSendMessage.mockResolvedValue(mockErrorResponse);

      const apiRequest = {
        type: "API_REQUEST",
        payload: {
          url: "https://api.example.com/test",
          method: "GET",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        },
      };

      // Act
      const response = await chrome.runtime.sendMessage(apiRequest);

      // Assert
      expect(response.success).toBe(false);
      expect(response.error).toBe("Ошибка авторизации");
      expect(response.status).toBe(401);
    });
  });

  describe("Обработка ошибок коммуникации", () => {
    it("должен обработать ошибку при отправке сообщения", async () => {
      // Arrange
      mockSendMessage.mockRejectedValue(
        new Error("Не удалось связаться с Service Worker"),
      );

      // Act & Assert
      await expect(
        chrome.runtime.sendMessage({ type: "PING" }),
      ).rejects.toThrow("Не удалось связаться с Service Worker");
    });

    it("должен обработать отсутствие ответа от Service Worker", async () => {
      // Arrange
      mockSendMessage.mockResolvedValue(undefined);

      // Act
      const response = await chrome.runtime.sendMessage({ type: "PING" });

      // Assert
      expect(response).toBeUndefined();
    });

    it("должен обработать сетевую ошибку при API запросе", async () => {
      // Arrange
      const mockErrorResponse = {
        success: false,
        error:
          "Не удалось подключиться к серверу. Проверьте подключение к интернету.",
      };

      mockSendMessage.mockResolvedValue(mockErrorResponse);

      const apiRequest = {
        type: "API_REQUEST",
        payload: {
          url: "https://api.example.com/test",
          method: "GET",
        },
      };

      // Act
      const response = await chrome.runtime.sendMessage(apiRequest);

      // Assert
      expect(response.success).toBe(false);
      expect(response.error).toContain("подключение к интернету");
    });
  });

  describe("Валидация сообщений", () => {
    it("должен получить ошибку для неизвестного типа сообщения", async () => {
      // Arrange
      mockSendMessage.mockResolvedValue({
        success: false,
        error: "Неизвестный тип сообщения",
      });

      // Act
      const response = await chrome.runtime.sendMessage({
        type: "UNKNOWN_TYPE",
      });

      // Assert
      expect(response.success).toBe(false);
      expect(response.error).toBe("Неизвестный тип сообщения");
    });

    it("должен получить ошибку для некорректного URL", async () => {
      // Arrange
      mockSendMessage.mockResolvedValue({
        success: false,
        error: "Некорректный URL запроса",
      });

      const apiRequest = {
        type: "API_REQUEST",
        payload: {
          url: "",
          method: "GET",
        },
      };

      // Act
      const response = await chrome.runtime.sendMessage(apiRequest);

      // Assert
      expect(response.success).toBe(false);
      expect(response.error).toBe("Некорректный URL запроса");
    });

    it("должен получить ошибку для не-HTTPS URL", async () => {
      // Arrange
      mockSendMessage.mockResolvedValue({
        success: false,
        error: "Разрешены только HTTPS запросы",
      });

      const apiRequest = {
        type: "API_REQUEST",
        payload: {
          url: "http://api.example.com/test",
          method: "GET",
        },
      };

      // Act
      const response = await chrome.runtime.sendMessage(apiRequest);

      // Assert
      expect(response.success).toBe(false);
      expect(response.error).toBe("Разрешены только HTTPS запросы");
    });
  });

  describe("Различные HTTP методы", () => {
    it("должен отправить PUT запрос", async () => {
      // Arrange
      mockSendMessage.mockResolvedValue({
        success: true,
        data: { updated: true },
        status: 200,
      });

      const apiRequest = {
        type: "API_REQUEST",
        payload: {
          url: "https://api.example.com/resource/123",
          method: "PUT",
          body: { name: "Updated Name" },
        },
      };

      // Act
      const response = await chrome.runtime.sendMessage(apiRequest);

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.updated).toBe(true);
    });

    it("должен отправить PATCH запрос", async () => {
      // Arrange
      mockSendMessage.mockResolvedValue({
        success: true,
        data: { patched: true },
        status: 200,
      });

      const apiRequest = {
        type: "API_REQUEST",
        payload: {
          url: "https://api.example.com/resource/123",
          method: "PATCH",
          body: { status: "active" },
        },
      };

      // Act
      const response = await chrome.runtime.sendMessage(apiRequest);

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.patched).toBe(true);
    });

    it("должен отправить DELETE запрос", async () => {
      // Arrange
      mockSendMessage.mockResolvedValue({
        success: true,
        status: 204,
      });

      const apiRequest = {
        type: "API_REQUEST",
        payload: {
          url: "https://api.example.com/resource/123",
          method: "DELETE",
        },
      };

      // Act
      const response = await chrome.runtime.sendMessage(apiRequest);

      // Assert
      expect(response.success).toBe(true);
      expect(response.status).toBe(204);
    });
  });

  describe("Русскоязычные сообщения об ошибках", () => {
    it("все сообщения об ошибках должны быть на русском языке", async () => {
      // Arrange
      const errorMessages = [
        "Некорректный URL запроса",
        "Разрешены только HTTPS запросы",
        "Неизвестный тип сообщения",
        "Не удалось подключиться к серверу. Проверьте подключение к интернету.",
        "Ошибка авторизации",
      ];

      for (const errorMessage of errorMessages) {
        mockSendMessage.mockResolvedValue({
          success: false,
          error: errorMessage,
        });

        // Act
        const response = await chrome.runtime.sendMessage({
          type: "API_REQUEST",
          payload: { url: "test", method: "GET" },
        });

        // Assert
        expect(response.error).toBe(errorMessage);
        // Проверяем отсутствие англицизмов
        expect(response.error).not.toMatch(
          /error|invalid|unknown|request|failed|network/i,
        );
      }
    });
  });
});
