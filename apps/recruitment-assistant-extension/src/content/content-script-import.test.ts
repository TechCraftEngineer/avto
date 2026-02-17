/**
 * Unit-тесты для Content Script - Import функциональность
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CandidateData } from "../shared/types";

vi.mock("../config", () => ({ API_URL: "https://api.example.com" }));

describe("ContentScript - Import функциональность", () => {
  let mockCandidateData: CandidateData;

  beforeEach(() => {
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

    global.chrome = {
      storage: {
        local: {
          get: vi.fn().mockImplementation((keys: string | string[]) => {
            const keyList = Array.isArray(keys) ? keys : [keys];
            const result: Record<string, unknown> = {};
            if (keyList.includes("authToken")) result.authToken = "test-auth-token";
            if (keyList.includes("userData"))
              result.userData = { organizationId: "org-123" };
            return Promise.resolve(result);
          }),
          set: vi.fn().mockResolvedValue(undefined),
          remove: vi.fn().mockResolvedValue(undefined),
        },
      },
    } as any;

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
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      await contentScript.handleImport();

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/candidates/import",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-auth-token",
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

    it("должен включить токен аутентификации в запрос", async () => {
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;

      await contentScript.handleImport();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-auth-token",
          }),
        }),
      );
    });

    it("должен показать ошибку если пользователь не авторизован", async () => {
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        authToken: null,
        userData: { organizationId: "org-123" },
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      await contentScript.handleImport();

      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("Войдите в систему"),
        }),
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("должен показать ошибку если нет organizationId", async () => {
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        authToken: "test-token",
        userData: {},
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();
      contentScript.currentData = mockCandidateData;
      const showNotificationSpy = vi.spyOn(contentScript, "showNotification");

      await contentScript.handleImport();

      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("Войдите в систему"),
        }),
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("checkAuthentication", () => {
    it("должен вернуть true если пользователь авторизован", async () => {
      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      const result = await contentScript.checkAuthentication();

      expect(result).toBe(true);
    });

    it("должен вернуть false если нет organizationId", async () => {
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        authToken: "test-token",
        userData: {},
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      const result = await contentScript.checkAuthentication();

      expect(result).toBe(false);
    });

    it("должен вернуть false если пользователь не авторизован", async () => {
      global.chrome.storage.local.get = vi.fn().mockResolvedValue({
        authToken: null,
        userData: { organizationId: "org-123" },
      });

      const { ContentScript } = await import("./content-script");
      const contentScript = new (ContentScript as any)();

      const result = await contentScript.checkAuthentication();

      expect(result).toBe(false);
    });
  });
});
