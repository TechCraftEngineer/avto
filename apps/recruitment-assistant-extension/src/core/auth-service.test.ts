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
});
