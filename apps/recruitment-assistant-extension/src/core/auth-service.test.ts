/**
 * Unit-тесты для AuthService
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import { AuthService } from "./auth-service";

// Мок для chrome.storage.local
const mockStorage = {
  data: {} as Record<string, any>,
  get: mock((keys: string | string[]) => {
    if (typeof keys === "string") {
      return Promise.resolve({ [keys]: mockStorage.data[keys] });
    }
    const result: Record<string, any> = {};
    for (const key of keys) {
      if (key in mockStorage.data) {
        result[key] = mockStorage.data[key];
      }
    }
    return Promise.resolve(result);
  }),
  set: mock((items: Record<string, any>) => {
    Object.assign(mockStorage.data, items);
    return Promise.resolve();
  }),
  remove: mock((keys: string | string[]) => {
    const keysArray = typeof keys === "string" ? [keys] : keys;
    for (const key of keysArray) {
      delete mockStorage.data[key];
    }
    return Promise.resolve();
  }),
  clear: () => {
    mockStorage.data = {};
  },
};

// Мок для глобального chrome API
(globalThis as any).chrome = {
  storage: {
    local: mockStorage,
  },
};

// Мок для fetch
const mockFetch = mock((_url: string, _options?: RequestInit) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response);
});

(globalThis as any).fetch = mockFetch;

describe("AuthService", () => {
  const apiUrl = "https://api.example.com";
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(apiUrl);
    mockStorage.clear();
    mockFetch.mockClear();
    mockStorage.get.mockClear();
    mockStorage.set.mockClear();
    mockStorage.remove.mockClear();
  });

  describe("login", () => {
    it("должен успешно авторизовать пользователя с корректными учетными данными", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      const mockResponse = {
        token: "test-token-123",
        user: {
          id: "user-1",
          email: "test@example.com",
          organizationId: "org-1",
        },
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.token).toBe("test-token-123");
      expect(result.user).toEqual(mockResponse.user);
      expect(mockFetch).toHaveBeenCalledWith(
        `${apiUrl}/api/auth/login`,
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        }),
      );
    });

    it("должен сохранить токен и данные пользователя после успешной авторизации", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      const mockResponse = {
        token: "test-token-123",
        user: {
          id: "user-1",
          email: "test@example.com",
          organizationId: "org-1",
        },
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        } as Response),
      );

      await authService.login(credentials);

      expect(mockStorage.set).toHaveBeenCalledWith({
        authToken: "test-token-123",
        userData: mockResponse.user,
      });
    });

    it("должен вернуть ошибку при неверных учетных данных", async () => {
      const credentials = {
        email: "test@example.com",
        password: "wrong-password",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              message: "Неверный email или пароль",
            }),
        } as Response),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Неверный email или пароль");
      expect(result.token).toBeUndefined();
      expect(result.user).toBeUndefined();
    });

    it("должен вернуть общую ошибку при отсутствии сообщения от сервера", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}),
        } as Response),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Ошибка авторизации");
    });

    it("должен обработать сетевую ошибку", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error("Network error")),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Не удалось подключиться к серверу");
    });
  });

  describe("logout", () => {
    it("должен удалить токен и данные пользователя из хранилища", async () => {
      // Сначала сохраняем данные
      await mockStorage.set({
        authToken: "test-token",
        userData: { id: "user-1", email: "test@example.com" },
      });

      await authService.logout();

      expect(mockStorage.remove).toHaveBeenCalledWith([
        "authToken",
        "userData",
      ]);
      expect(mockStorage.data.authToken).toBeUndefined();
      expect(mockStorage.data.userData).toBeUndefined();
    });
  });

  describe("isAuthenticated", () => {
    it("должен вернуть true если токен существует", async () => {
      await mockStorage.set({ authToken: "test-token" });

      const result = await authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it("должен вернуть false если токен отсутствует", async () => {
      const result = await authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("getToken", () => {
    it("должен вернуть токен если он существует", async () => {
      await mockStorage.set({ authToken: "test-token-123" });

      const token = await authService.getToken();

      expect(token).toBe("test-token-123");
    });

    it("должен вернуть null если токен отсутствует", async () => {
      const token = await authService.getToken();

      expect(token).toBeNull();
    });
  });

  describe("getUserData", () => {
    it("должен вернуть данные пользователя если они существуют", async () => {
      const userData = {
        id: "user-1",
        email: "test@example.com",
        organizationId: "org-1",
      };

      await mockStorage.set({ userData });

      const result = await authService.getUserData();

      expect(result).toEqual(userData);
    });

    it("должен вернуть null если данные пользователя отсутствуют", async () => {
      const result = await authService.getUserData();

      expect(result).toBeNull();
    });
  });

  describe("validateToken", () => {
    it("должен вернуть true для валидного токена", async () => {
      await mockStorage.set({ authToken: "valid-token" });

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
        } as Response),
      );

      const result = await authService.validateToken();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${apiUrl}/api/auth/validate`,
        expect.objectContaining({
          headers: {
            Authorization: "Bearer valid-token",
          },
        }),
      );
    });

    it("должен вернуть false для невалидного токена", async () => {
      await mockStorage.set({ authToken: "invalid-token" });

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
        } as Response),
      );

      const result = await authService.validateToken();

      expect(result).toBe(false);
    });

    it("должен вернуть false если токен отсутствует", async () => {
      const result = await authService.validateToken();

      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("должен вернуть false при сетевой ошибке", async () => {
      await mockStorage.set({ authToken: "test-token" });

      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error("Network error")),
      );

      const result = await authService.validateToken();

      expect(result).toBe(false);
    });
  });

  describe("граничные случаи", () => {
    it("должен обработать пустой email", async () => {
      const credentials = {
        email: "",
        password: "password123",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              message: "Email обязателен",
            }),
        } as Response),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
    });

    it("должен обработать пустой пароль", async () => {
      const credentials = {
        email: "test@example.com",
        password: "",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              message: "Пароль обязателен",
            }),
        } as Response),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
    });

    it("должен обработать некорректный формат email", async () => {
      const credentials = {
        email: "not-an-email",
        password: "password123",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              message: "Некорректный формат email",
            }),
        } as Response),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
    });
  });
});
