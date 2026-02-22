import { describe, expect, it, mock } from "bun:test";
import { call, ORPCError } from "@orpc/server";
import type { Session } from "@qbs-autonaim/auth";
import type { Context } from "../../../orpc";

const mockInngestSend = mock(() => Promise.resolve({ ids: ["event-123"] }));

mock.module("@qbs-autonaim/jobs/client", () => ({
  inngest: { send: mockInngestSend },
}));

import { syncArchivedVacancyResponses } from "./sync-archived-vacancy-responses";

describe("syncArchivedVacancyResponses", () => {
  const mockSession: Session = {
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
    },
    sessionToken: "token-123",
    userId: "user-123",
    expires: new Date(Date.now() + 86400000),
  };

  const mockWorkspaceId = "ws_1234567890abcdef1234567890abcdef";
  const mockVacancyId = "00000000-0000-0000-0000-000000000000";

  const createMockContext = (overrides: Partial<Context> = {}) =>
    ({
      session: mockSession,
      workspaceRepository: {
        checkAccess: mock(() => Promise.resolve(true)),
      },
      db: {
        query: {
          vacancy: {
            findFirst: mock(() => Promise.resolve(null)),
          },
          vacancyPublication: {
            findFirst: mock(() => Promise.resolve(null)),
          },
        },
      },
      ...overrides,
    }) as unknown as Context;

  const callProcedure = async (
    context: Context,
    input: { workspaceId: string; vacancyId: string },
  ) => {
    // В oRPC процедуры вызываются через call из @orpc/server
    return call(syncArchivedVacancyResponses, input, { context });
  };

  it("должен выбросить FORBIDDEN если нет доступа к workspace", async () => {
    const mockCtx = createMockContext({
      workspaceRepository: {
        checkAccess: mock(() => Promise.resolve(false)),
      },
    });

    try {
      await callProcedure(mockCtx, {
        workspaceId: mockWorkspaceId,
        vacancyId: mockVacancyId,
      });
      expect(true).toBe(false); // Не должно дойти сюда
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("FORBIDDEN");
      expect((error as ORPCError).message).toBe("Нет доступа к workspace");
    }
  });

  it("должен выбросить NOT_FOUND если вакансия не найдена", async () => {
    const mockCtx = createMockContext({
      db: {
        query: {
          vacancy: {
            findFirst: mock(() => Promise.resolve(null)),
          },
          vacancyPublication: {
            findFirst: mock(() => Promise.resolve(null)),
          },
        },
      },
    });

    try {
      await callProcedure(mockCtx, {
        workspaceId: mockWorkspaceId,
        vacancyId: mockVacancyId,
      });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("NOT_FOUND");
      expect((error as ORPCError).message).toBe("Вакансия не найдена");
    }
  });

  it("должен выбросить BAD_REQUEST если публикация не найдена", async () => {
    const mockVacancy = {
      id: mockVacancyId,
      workspaceId: mockWorkspaceId,
      title: "Test Vacancy",
    };

    const mockCtx = createMockContext({
      db: {
        query: {
          vacancy: {
            findFirst: mock(() => Promise.resolve(mockVacancy)),
          },
          vacancyPublication: {
            findFirst: mock(() => Promise.resolve(null)),
          },
        },
      },
    });

    try {
      await callProcedure(mockCtx, {
        workspaceId: mockWorkspaceId,
        vacancyId: mockVacancyId,
      });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("BAD_REQUEST");
      expect((error as ORPCError).message).toBe(
        "Вакансия не опубликована на HH.ru (HeadHunter)",
      );
    }
  });

  it("должен выбросить BAD_REQUEST если нет externalId или url", async () => {
    const mockVacancy = {
      id: mockVacancyId,
      workspaceId: mockWorkspaceId,
      title: "Test Vacancy",
    };

    const mockPublication = {
      id: "pub-123",
      vacancyId: mockVacancyId,
      platform: "HH",
      externalId: null,
      url: null,
    };

    const mockCtx = createMockContext({
      db: {
        query: {
          vacancy: {
            findFirst: mock(() => Promise.resolve(mockVacancy)),
          },
          vacancyPublication: {
            findFirst: mock(() => Promise.resolve(mockPublication)),
          },
        },
      },
    });

    try {
      await callProcedure(mockCtx, {
        workspaceId: mockWorkspaceId,
        vacancyId: mockVacancyId,
      });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ORPCError);
      expect((error as ORPCError).code).toBe("BAD_REQUEST");
      expect((error as ORPCError).message).toBe(
        "У публикации нет внешнего идентификатора или ссылки для синхронизации",
      );
    }
  });

  it("должен успешно запустить синхронизацию с валидными данными", async () => {
    mockInngestSend.mockClear();

    const mockVacancy = {
      id: mockVacancyId,
      workspaceId: mockWorkspaceId,
      title: "Test Vacancy",
    };

    const mockPublication = {
      id: "pub-123",
      vacancyId: mockVacancyId,
      platform: "HH",
      externalId: "ext-123",
      url: "https://hh.ru/vacancy/123",
    };

    const mockCtx = createMockContext({
      db: {
        query: {
          vacancy: {
            findFirst: mock(() => Promise.resolve(mockVacancy)),
          },
          vacancyPublication: {
            findFirst: mock(() => Promise.resolve(mockPublication)),
          },
        },
      },
    });

    const result = await callProcedure(mockCtx, {
      workspaceId: mockWorkspaceId,
      vacancyId: mockVacancyId,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe(
      "Синхронизация откликов с архивной вакансии запущена в фоне",
    );
    expect(result.platform).toBe("HH");
    expect(result.vacancyTitle).toBe("Test Vacancy");
    expect(mockInngestSend).toHaveBeenCalledTimes(1);
  });
});
