import { beforeEach, describe, expect, it, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";

// Mock ДО импорта хука (модуль кэшируется при первом импорте)
const mockUseInngestSubscription = mock(() => ({
  data: [] as any[],
  error: null as Error | null,
  latestData: null as any,
}));

mock.module("@bunworks/inngest-realtime/hooks", () => ({
  useInngestSubscription: mockUseInngestSubscription,
}));

const { useSyncArchivedSubscription } = await import(
  "./use-sync-archived-subscription"
);

beforeEach(() => {
  mockUseInngestSubscription.mockClear();
  // Повторно применяем мок перед каждым тестом (другие файлы могут перезаписать)
  mock.module("@bunworks/inngest-realtime/hooks", () => ({
    useInngestSubscription: mockUseInngestSubscription,
  }));
});

describe("useSyncArchivedSubscription", () => {
  const mockVacancyId = "vacancy-123";
  const mockFetchToken = mock(() => Promise.resolve("token-123"));

  it("должен вызывать onMessage при получении progress сообщения", async () => {
    const mockOnMessage = mock(() => {});
    const mockOnStatusChange = mock(() => {});

    const mockLatestData = {
      kind: "data" as const,
      topic: "progress",
      data: {
        status: "processing" as const,
        message: "Обработка откликов",
        vacancyId: mockVacancyId,
        syncedResponses: 10,
        newResponses: 5,
      },
    };

    mockUseInngestSubscription.mockReturnValue({
      data: [mockLatestData],
      error: null,
      latestData: mockLatestData,
    });

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: true,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    await waitFor(() => {
      expect(mockOnMessage).toHaveBeenCalled();
    });
  });

  it("должен вызывать onStatusChange при получении result сообщения", async () => {
    const mockOnMessage = mock(() => {});
    const mockOnStatusChange = mock(() => {});

    const mockLatestData = {
      kind: "data" as const,
      topic: "result",
      data: {
        vacancyId: mockVacancyId,
        success: true,
        syncedResponses: 20,
        newResponses: 10,
        vacancyTitle: "Test Vacancy",
      },
    };

    mockUseInngestSubscription.mockReturnValue({
      data: [mockLatestData],
      error: null,
      latestData: mockLatestData,
    });

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: true,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalled();
    });
  });

  it("должен вызывать onStatusChange с error при получении ошибки в progress", async () => {
    const mockOnMessage = mock(() => {});
    const mockOnStatusChange = mock(() => {});

    const mockLatestData = {
      kind: "data" as const,
      topic: "progress",
      data: {
        status: "error" as const,
        message: "Ошибка синхронизации",
        vacancyId: mockVacancyId,
      },
    };

    mockUseInngestSubscription.mockReturnValue({
      data: [mockLatestData],
      error: null,
      latestData: mockLatestData,
    });

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: true,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalled();
    });
  });

  it("должен обрабатывать невалидные данные в progress", async () => {
    const mockOnMessage = mock(() => {});
    const mockOnStatusChange = mock(() => {});

    const mockLatestData = {
      kind: "data" as const,
      topic: "progress",
      data: {
        // Невалидные данные - отсутствует обязательное поле status
        message: "Обработка откликов",
        vacancyId: mockVacancyId,
      },
    };

    mockUseInngestSubscription.mockReturnValue({
      data: [mockLatestData],
      error: null,
      latestData: mockLatestData,
    });

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: true,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalled();
    });
  });

  it("должен обрабатывать невалидные данные в result", async () => {
    const mockOnMessage = mock(() => {});
    const mockOnStatusChange = mock(() => {});

    const mockLatestData = {
      kind: "data" as const,
      topic: "result",
      data: {
        // Невалидные данные - отсутствуют обязательные поля
        vacancyId: mockVacancyId,
      },
    };

    mockUseInngestSubscription.mockReturnValue({
      data: [mockLatestData],
      error: null,
      latestData: mockLatestData,
    });

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: true,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalled();
    });
  });

  it("не должен обрабатывать сообщения если enabled=false", () => {
    const mockOnMessage = mock(() => {});
    const mockOnStatusChange = mock(() => {});

    mockUseInngestSubscription.mockReturnValue({
      data: [],
      error: null,
      latestData: null,
    });

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: false,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    expect(mockOnMessage).not.toHaveBeenCalled();
    expect(mockOnStatusChange).not.toHaveBeenCalled();
  });
});
