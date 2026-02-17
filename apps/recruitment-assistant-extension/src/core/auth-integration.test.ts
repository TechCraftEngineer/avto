/**
 * Интеграционные тесты для авторизации
 * Проверяют взаимодействие AuthService с API
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
const mockFetch = mock((url: string, options?: RequestInit) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response);
});

(globalThis as any).fetch = mockFetch;

describe("Интеграция авторизации", () => {
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

  describe("полный цикл авторизации", () => {
    it("должен выполнить полный цикл: вход → проверка → выход", async () => {
      // 1. Вход
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      const mockLoginResponse = {
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
          json: () => Promise.resolve(mockLoginResponse),
        } as Response),
      );

      const loginResult = await authService.login(credentials);

      expect(loginResult.success).toBe(true);
      expect(loginResult.token).toBe("test-token-123");

      // 2. Проверка авторизации
      const isAuth = await authService.isAuthenticated();
      expect(isAuth).toBe(true);

      // 3. Получение токена
      const token = await authService.getToken();
      expect(token).toBe("test-token-123");

      // 4. Получение данных пользователя
      const userData = await authService.getUserData();
      expect(userData).toEqual(mockLoginResponse.user);

      // 5. Выход
      await authService.logout();

      // 6. Проверка что пользователь вышел
      const isAuthAfterLogout = await authService.isAuthenticated();
      expect(isAuthAfterLogout).toBe(false);

      const tokenAfterLogout = await authService.getToken();
      expect(tokenAfterLogout).toBeNull();
    });

    it("должен корректно обработать истекший токен", async () => {
      // 1. Сохраняем токен
      await mockStorage.set({ authToken: "expired-token" });

      // 2. Проверяем что пользователь авторизован (токен есть)
      const isAuth = await authService.isAuthenticated();
      expect(isAuth).toBe(true);

      // 3. Проверяем валидность токена (сервер возвращает 401)
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        } as Response),
      );

      const isValid = await authService.validateToken();
      expect(isValid).toBe(false);

      // 4. Токен невалиден, нужна повторная авторизация
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      const mockLoginResponse = {
        token: "new-token-456",
        user: {
          id: "user-1",
          email: "test@example.com",
          organizationId: "org-1",
        },
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLoginResponse),
        } as Response),
      );

      const loginResult = await authService.login(credentials);
      expect(loginResult.success).toBe(true);
      expect(loginResult.token).toBe("new-token-456");

      // 5. Проверяем что новый токен сохранен
      const newToken = await authService.getToken();
      expect(newToken).toBe("new-token-456");
    });
  });

  describe("обработка ошибок API", () => {
    it("должен обработать ошибку 401 (неверные учетные данные)", async () => {
      const credentials = {
        email: "test@example.com",
        password: "wrong-password",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () =>
            Promise.resolve({
              message: "Неверный email или пароль",
            }),
        } as Response),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Неверный email или пароль");
      expect(mockStorage.set).not.toHaveBeenCalled();
    });

    it("должен обработать ошибку 500 (внутренняя ошибка сервера)", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () =>
            Promise.resolve({
              message: "Внутренняя ошибка сервера",
            }),
        } as Response),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Внутренняя ошибка сервера");
    });

    it("должен обработать сетевую ошибку (нет подключения)", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error("Failed to fetch")),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Не удалось подключиться к серверу");
    });

    it("должен обработать таймаут запроса", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error("Request timeout")),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Не удалось подключиться к серверу");
    });
  });

  describe("взаимодействие с хранилищем", () => {
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

      expect(mockStorage.data.authToken).toBe("test-token-123");
      expect(mockStorage.data.userData).toEqual(mockResponse.user);
    });

    it("должен удалить токен и данные пользователя при выходе", async () => {
      // Сначала сохраняем данные
      await mockStorage.set({
        authToken: "test-token",
        userData: { id: "user-1", email: "test@example.com" },
      });

      expect(mockStorage.data.authToken).toBeDefined();
      expect(mockStorage.data.userData).toBeDefined();

      // Выходим
      await authService.logout();

      expect(mockStorage.remove).toHaveBeenCalledWith([
        "authToken",
        "userData",
      ]);
      expect(mockStorage.data.authToken).toBeUndefined();
      expect(mockStorage.data.userData).toBeUndefined();
    });

    it("должен корректно читать данные из хранилища", async () => {
      const testToken = "stored-token-789";
      const testUser = {
        id: "user-2",
        email: "stored@example.com",
        organizationId: "org-2",
      };

      await mockStorage.set({
        authToken: testToken,
        userData: testUser,
      });

      const token = await authService.getToken();
      const userData = await authService.getUserData();

      expect(token).toBe(testToken);
      expect(userData).toEqual(testUser);
    });
  });

  describe("валидация токена", () => {
    it("должен отправить правильный заголовок Authorization при валидации", async () => {
      await mockStorage.set({ authToken: "test-token" });

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
        } as Response),
      );

      await authService.validateToken();

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiUrl}/api/auth/validate`,
        expect.objectContaining({
          headers: {
            Authorization: "Bearer test-token",
          },
        }),
      );
    });

    it("должен вернуть false если токен отсутствует", async () => {
      const isValid = await authService.validateToken();

      expect(isValid).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("должен вернуть true для валидного токена", async () => {
      await mockStorage.set({ authToken: "valid-token" });

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
        } as Response),
      );

      const isValid = await authService.validateToken();

      expect(isValid).toBe(true);
    });

    it("должен вернуть false для невалидного токена", async () => {
      await mockStorage.set({ authToken: "invalid-token" });

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        } as Response),
      );

      const isValid = await authService.validateToken();

      expect(isValid).toBe(false);
    });
  });

  describe("граничные случаи", () => {
    it("должен обработать повторный вход без выхода", async () => {
      // Первый вход
      const credentials1 = {
        email: "user1@example.com",
        password: "password1",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              token: "token-1",
              user: { id: "user-1", email: "user1@example.com" },
            }),
        } as Response),
      );

      await authService.login(credentials1);

      const token1 = await authService.getToken();
      expect(token1).toBe("token-1");

      // Второй вход (без выхода)
      const credentials2 = {
        email: "user2@example.com",
        password: "password2",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              token: "token-2",
              user: { id: "user-2", email: "user2@example.com" },
            }),
        } as Response),
      );

      await authService.login(credentials2);

      // Должен быть сохранен новый токен
      const token2 = await authService.getToken();
      expect(token2).toBe("token-2");

      const userData = await authService.getUserData();
      expect(userData.email).toBe("user2@example.com");
    });

    it("должен обработать пустой ответ от сервера", async () => {
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

    it("должен обработать некорректный JSON в ответе", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.reject(new Error("Invalid JSON")),
        } as Response),
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Не удалось подключиться к серверу");
    });
  });
});
