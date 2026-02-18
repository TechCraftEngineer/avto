/**
 * Интеграционные тесты для авторизации
 * Проверяют взаимодействие AuthService с API.
 * Вход только через «Войти через сайт» (callback сохраняет токен).
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
    it("должен выполнить цикл: вход через сайт (callback) → проверка → выход", async () => {
      // 1. Имитируем сохранение токена callback-страницей после «Войти через сайт»
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        organizationId: "org-1",
      };

      await mockStorage.set({
        authToken: "test-token-123",
        userData: mockUser,
      });

      // 2. Проверка авторизации
      const isAuth = await authService.isAuthenticated();
      expect(isAuth).toBe(true);

      // 3. Получение токена
      const token = await authService.getToken();
      expect(token).toBe("test-token-123");

      // 4. Получение данных пользователя
      const userData = await authService.getUserData();
      expect(userData).toEqual(mockUser);

      // 5. Выход
      await authService.logout();

      // 6. Проверка что пользователь вышел
      const isAuthAfterLogout = await authService.isAuthenticated();
      expect(isAuthAfterLogout).toBe(false);

      const tokenAfterLogout = await authService.getToken();
      expect(tokenAfterLogout).toBeNull();
    });

    it("должен корректно обработать истекший токен", async () => {
      // 1. Сохраняем токен (как после callback)
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
    });
  });

  describe("взаимодействие с хранилищем", () => {
    it("должен удалить токен и данные пользователя при выходе", async () => {
      await mockStorage.set({
        authToken: "test-token",
        userData: { id: "user-1", email: "test@example.com" },
      });

      expect(mockStorage.data.authToken).toBeDefined();
      expect(mockStorage.data.userData).toBeDefined();

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
});
