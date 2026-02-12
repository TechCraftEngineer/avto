import { describe, expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useSyncArchivedSubscription } from "./use-sync-archived-subscription";

// Mock useInngestSubscription
mock.module("@bunworks/inngest-realtime/hooks", () => ({
  useInngestSubscription: mock(() => ({
    data: [],
    error: null,
    latestData: null,
  })),
}));

describe("useSyncArchivedSubscription", () => {
  const mockVacancyId = "vacancy-123";
  const mockFetchToken = mock(() => Promise.resolve("token-123"));

  it("должен вызывать onMessage при получении progress сообщения", () => {
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

    // Mock useInngestSubscription для этого теста
    mock.module("@bunworks/inngest-realtime/hooks", () => ({
      useInngestSubscription: () => ({
        data: [mockLatestData],
        error: null,
        latestData: mockLatestData,
      }),
    }));

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: true,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    expect(mockOnMessage).toHaveBeenCalledWith("Обработка откликов", {
      status: "processing",
      message: "Обработка откликов",
      vacancyId: mockVacancyId,
      syncedResponses: 10,
      newResponses: 5,
    });
  });

  it("должен вызывать onStatusChange при получении result сообщения", () => {
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

    mock.module("@bunworks/inngest-realtime/hooks", () => ({
      useInngestSubscription: () => ({
        data: [mockLatestData],
        error: null,
        latestData: mockLatestData,
      }),
    }));

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: true,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    expect(mockOnStatusChange).toHaveBeenCalledWith(
      "completed",
      expect.stringContaining("Синхронизация завершена"),
    );
  });

  it("должен вызывать onStatusChange с error при получении ошибки в progress", () => {
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

    mock.module("@bunworks/inngest-realtime/hooks", () => ({
      useInngestSubscription: () => ({
        data: [mockLatestData],
        error: null,
        latestData: mockLatestData,
      }),
    }));

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: true,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    expect(mockOnStatusChange).toHaveBeenCalledWith(
      "error",
      "Ошибка синхронизации",
    );
  });

  it("должен обрабатывать невалидные данные в progress", () => {
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

    mock.module("@bunworks/inngest-realtime/hooks", () => ({
      useInngestSubscription: () => ({
        data: [mockLatestData],
        error: null,
        latestData: mockLatestData,
      }),
    }));

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: true,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    expect(mockOnStatusChange).toHaveBeenCalledWith(
      "error",
      "недопустимая realtime-полезная нагрузка",
    );
  });

  it("должен обрабатывать невалидные данные в result", () => {
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

    mock.module("@bunworks/inngest-realtime/hooks", () => ({
      useInngestSubscription: () => ({
        data: [mockLatestData],
        error: null,
        latestData: mockLatestData,
      }),
    }));

    renderHook(() =>
      useSyncArchivedSubscription({
        vacancyId: mockVacancyId,
        enabled: true,
        fetchToken: mockFetchToken,
        onStatusChange: mockOnStatusChange,
        onMessage: mockOnMessage,
      }),
    );

    expect(mockOnStatusChange).toHaveBeenCalledWith(
      "error",
      "недопустимая realtime-полезная нагрузка",
    );
  });

  it("не должен обрабатывать сообщения если enabled=false", () => {
    const mockOnMessage = mock(() => {});
    const mockOnStatusChange = mock(() => {});

    mock.module("@bunworks/inngest-realtime/hooks", () => ({
      useInngestSubscription: () => ({
        data: [],
        error: null,
        latestData: null,
      }),
    }));

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
