import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";
import * as realVacancyResponsesContext from "../context/vacancy-responses-context";
import { useSyncArchivedState } from "./use-sync-archived-state";

// Mock dependencies
const mockUseWorkspace = mock(() => ({
  workspace: {
    id: "workspace-123",
    name: "Test Workspace",
  },
}));

const mockSetHandler = mock(() => {});
const mockUseVacancyOperation = mock(() => ({
  setHandler: mockSetHandler,
}));

const noop = () => {};
const mockUseVacancyResponses = mock(() => ({
  registerOnArchivedSyncComplete: mock(() => {}),
  getOnArchivedSyncComplete: () => null,
  registerOnScreenAllProgress: noop,
  registerOnScreenAllComplete: noop,
  getOnScreenAllProgress: () => null,
  getOnScreenAllComplete: () => null,
}));

const mockFetchSyncArchivedVacancyResponsesToken = mock(() =>
  Promise.resolve("token-123"),
);

// Общая заглушка для остальных экспортов realtime (нужны другим тестам)
const tokenFn = () =>
  Promise.resolve({ channel: "test", topics: ["progress", "result"], key: "k" });

// Mock модулей перед каждым тестом
beforeEach(() => {
  mock.module("~/hooks/use-workspace", () => ({
    useWorkspace: mockUseWorkspace,
  }));

  mock.module("../context/vacancy-responses-context", () => ({
    ...realVacancyResponsesContext,
    useVacancyOperation: mockUseVacancyOperation,
    useVacancyResponses: mockUseVacancyResponses,
  }));

  mock.module("~/actions/realtime", () => ({
    fetchSyncArchivedVacancyResponsesToken:
      mockFetchSyncArchivedVacancyResponsesToken,
    fetchRefreshVacancyResponsesToken: tokenFn,
    fetchScreenNewResponsesToken: tokenFn,
    fetchScreenAllResponsesToken: tokenFn,
  }));
});

afterAll(() => {
  // Восстанавливаем контекст для последующих тестов (websocket и др.)
  const restore = () => realVacancyResponsesContext;
  mock.module("../context/vacancy-responses-context", restore);
  mock.module(
    "~/components/vacancy/components/responses/context/vacancy-responses-context",
    restore,
  );
});

describe("useSyncArchivedState", () => {
  const mockVacancyId = "vacancy-123";
  const mockOnSyncArchived = mock(() => Promise.resolve());
  const mockOnRefreshComplete = mock(() => {});

  it("должен инициализироваться с idle статусом", () => {
    const { result } = renderHook(() =>
      useSyncArchivedState(
        mockVacancyId,
        mockOnSyncArchived,
        mockOnRefreshComplete,
      ),
    );

    expect(result.current.status).toBe("idle");
    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.syncedCount).toBe(0);
    expect(result.current.newCount).toBe(0);
  });

  it("должен открывать диалог при вызове setDialogOpen", () => {
    const { result } = renderHook(() =>
      useSyncArchivedState(
        mockVacancyId,
        mockOnSyncArchived,
        mockOnRefreshComplete,
      ),
    );

    act(() => {
      result.current.setDialogOpen(true);
    });

    expect(result.current.dialogOpen).toBe(true);
  });

  it("должен закрывать диалог и сбрасывать состояние при handleDialogClose", () => {
    const { result } = renderHook(() =>
      useSyncArchivedState(
        mockVacancyId,
        mockOnSyncArchived,
        mockOnRefreshComplete,
      ),
    );

    // Открываем диалог и устанавливаем некоторое состояние
    act(() => {
      result.current.setDialogOpen(true);
    });

    // Закрываем диалог
    act(() => {
      result.current.handleDialogClose();
    });

    expect(result.current.dialogOpen).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.message).toBe("");
    expect(result.current.status).toBe("idle");
  });

  it("должен устанавливать loading статус при вызове handleClick", async () => {
    const { result } = renderHook(() =>
      useSyncArchivedState(
        mockVacancyId,
        mockOnSyncArchived,
        mockOnRefreshComplete,
      ),
    );

    await result.current.handleClick();

    await waitFor(() => {
      expect(result.current.status).toBe("loading");
      expect(result.current.subscriptionActive).toBe(true);
    });
  });

  it("должен вызывать onSyncArchived с workspaceId при handleClick", async () => {
    const mockOnSync = mock(() => Promise.resolve());

    const { result } = renderHook(() =>
      useSyncArchivedState(mockVacancyId, mockOnSync, mockOnRefreshComplete),
    );

    await result.current.handleClick();

    await waitFor(() => {
      expect(mockOnSync).toHaveBeenCalled();
    });
  });

  it("должен обрабатывать ошибки при handleClick", async () => {
    const mockOnSyncError = mock(() =>
      Promise.reject(new Error("Ошибка синхронизации")),
    );

    const { result } = renderHook(() =>
      useSyncArchivedState(
        mockVacancyId,
        mockOnSyncError,
        mockOnRefreshComplete,
      ),
    );

    await result.current.handleClick();

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      expect(result.current.error).toBe("Ошибка синхронизации");
    });
  });

  it("должен сбрасывать ошибку при новом вызове handleClick", async () => {
    // Отдельный мок для первого вызова (ошибка) и второго (успех)
    let callCount = 0;
    const onSyncWithFlakyBehavior = mock(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Ошибка синхронизации");
      }
      return Promise.resolve();
    });

    const { result } = renderHook(() =>
      useSyncArchivedState(
        mockVacancyId,
        onSyncWithFlakyBehavior,
        mockOnRefreshComplete,
      ),
    );

    await act(async () => {
      await result.current.handleClick();
    });

    await waitFor(() => {
      expect(result.current.error).toBe("Ошибка синхронизации");
    });

    await act(async () => {
      await result.current.handleClick();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(null);
      expect(result.current.status).toBe("loading");
    });
  });
});
