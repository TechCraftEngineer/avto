import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSyncArchivedState } from "./use-sync-archived-state";

// Mock dependencies
const mockUseWorkspace = mock(() => ({
  workspace: {
    id: "workspace-123",
    name: "Test Workspace",
  },
}));

const mockUseVacancyOperation = mock(() => ({
  setHandler: mock(() => {}),
}));

const mockFetchSyncArchivedVacancyResponsesToken = mock(() =>
  Promise.resolve("token-123"),
);

const mockUseSyncArchivedSubscription = mock(() => ({}));

// Mock модулей перед каждым тестом
beforeEach(() => {
  mock.module("~/hooks/use-workspace", () => ({
    useWorkspace: mockUseWorkspace,
  }));

  mock.module("../context/vacancy-responses-context", () => ({
    useVacancyOperation: mockUseVacancyOperation,
  }));

  mock.module("~/actions/realtime", () => ({
    fetchSyncArchivedVacancyResponsesToken:
      mockFetchSyncArchivedVacancyResponsesToken,
  }));

  mock.module("./use-sync-archived-subscription", () => ({
    useSyncArchivedSubscription: mockUseSyncArchivedSubscription,
  }));
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
    const { result } = renderHook(() =>
      useSyncArchivedState(
        mockVacancyId,
        mockOnSyncArchived,
        mockOnRefreshComplete,
      ),
    );

    // Первый вызов с ошибкой
    const mockOnSyncError = mock(() =>
      Promise.reject(new Error("Ошибка синхронизации")),
    );

    // Временно заменяем обработчик
    const originalOnSyncArchived = mockOnSyncArchived;
    mockOnSyncArchived.mockImplementation(mockOnSyncError);

    await act(async () => {
      await result.current.handleClick();
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    // Восстанавливаем оригинальный обработчик
    mockOnSyncArchived.mockImplementation(originalOnSyncArchived);

    // Второй вызов должен сбросить ошибку
    await act(async () => {
      await result.current.handleClick();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(null);
      expect(result.current.status).toBe("loading");
    });
  });
});
