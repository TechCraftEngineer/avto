import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useResponseActions } from "./use-response-actions";

// Mock dependencies
const mockTriggerSyncArchivedVacancyResponses = mock(() =>
  Promise.resolve({ success: true }),
);
const mockToastError = mock(() => {});
const mockToastSuccess = mock(() => {});

const mockTrpc = {
  vacancy: {
    responses: {
      list: {
        pathFilter: () => ({}),
      },
    },
  },
};

let queryClient: QueryClient;
let invalidateQueriesSpy: ReturnType<typeof spyOn>;

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  invalidateQueriesSpy = spyOn(
    queryClient,
    "invalidateQueries",
  ).mockResolvedValue(undefined as never);
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  mock.module("~/actions/trigger", () => ({
    triggerRefreshVacancyResponses: mock(() =>
      Promise.resolve({ success: true }),
    ),
    triggerScreenAllResponses: mock(() => Promise.resolve({ success: true })),
    triggerScreenNewResponses: mock(() => Promise.resolve({ success: true })),
    triggerScreenResponsesBatch: mock(() => Promise.resolve({ success: true })),
    triggerSendWelcomeBatch: mock(() => Promise.resolve({ success: true })),
    triggerSyncArchivedVacancyResponses:
      mockTriggerSyncArchivedVacancyResponses,
  }));

  mock.module("sonner", () => ({
    toast: {
      error: mockToastError,
      success: mockToastSuccess,
    },
  }));

  mock.module("~/trpc/react", () => ({
    useORPC: () => mockTrpc,
  }));

  mockToastError.mockClear();
  mockToastSuccess.mockClear();
  mockTriggerSyncArchivedVacancyResponses.mockClear();
});

describe("useResponseActions", () => {
  const mockVacancyId = "vacancy-123";
  const mockWorkspaceId = "workspace-456";
  const mockSetSelectedIds = mock(() => {});

  describe("handleSyncArchived", () => {
    it("должен вызывать triggerSyncArchivedVacancyResponses с vacancyId и workspaceId", async () => {
      const { result } = renderHook(
        () =>
          useResponseActions(
            mockVacancyId,
            mockWorkspaceId,
            new Set(),
            mockSetSelectedIds,
          ),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.handleSyncArchived(mockWorkspaceId);
      });

      expect(mockTriggerSyncArchivedVacancyResponses).toHaveBeenCalledWith(
        mockVacancyId,
        mockWorkspaceId,
      );
    });

    it("должен показывать успешный toast при success", async () => {
      mockTriggerSyncArchivedVacancyResponses.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(
        () =>
          useResponseActions(
            mockVacancyId,
            mockWorkspaceId,
            new Set(),
            mockSetSelectedIds,
          ),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.handleSyncArchived(mockWorkspaceId);
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Синхронизация архивных откликов запущена",
      );
    });

    it("должен показывать toast.error при result.success=false", async () => {
      mockTriggerSyncArchivedVacancyResponses.mockResolvedValue({
        success: false,
        error: "Ошибка запуска",
      } as { success: false; error: string });

      const { result } = renderHook(
        () =>
          useResponseActions(
            mockVacancyId,
            mockWorkspaceId,
            new Set(),
            mockSetSelectedIds,
          ),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.handleSyncArchived(mockWorkspaceId);
      });

      expect(mockToastError).toHaveBeenCalledWith(
        "Не удалось запустить синхронизацию архивных откликов",
      );
    });

    it("должен сбрасывать isSyncingArchived при result.success=false", async () => {
      mockTriggerSyncArchivedVacancyResponses.mockResolvedValue({
        success: false,
        error: "Ошибка",
      } as { success: false; error: string });

      const { result } = renderHook(
        () =>
          useResponseActions(
            mockVacancyId,
            mockWorkspaceId,
            new Set(),
            mockSetSelectedIds,
          ),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.handleSyncArchived(mockWorkspaceId);
      });

      await waitFor(() => {
        expect(result.current.isSyncingArchived).toBe(false);
      });
    });

    it("должен показывать toast.error при исключении", async () => {
      mockTriggerSyncArchivedVacancyResponses.mockRejectedValue(
        new Error("Network error"),
      );

      const { result } = renderHook(
        () =>
          useResponseActions(
            mockVacancyId,
            mockWorkspaceId,
            new Set(),
            mockSetSelectedIds,
          ),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.handleSyncArchived(mockWorkspaceId);
      });

      expect(mockToastError).toHaveBeenCalledWith("Произошла ошибка");
    });

    it("должен устанавливать isSyncingArchived в true при вызове и оставлять true при успехе", async () => {
      mockTriggerSyncArchivedVacancyResponses.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 50);
          }),
      );

      const { result } = renderHook(
        () =>
          useResponseActions(
            mockVacancyId,
            mockWorkspaceId,
            new Set(),
            mockSetSelectedIds,
          ),
        { wrapper: createWrapper() },
      );

      expect(result.current.isSyncingArchived).toBe(false);

      let syncPromise: Promise<void> | undefined;
      act(() => {
        syncPromise = result.current.handleSyncArchived(mockWorkspaceId);
      });

      await waitFor(() => {
        expect(result.current.isSyncingArchived).toBe(true);
      });

      await act(async () => {
        if (syncPromise) await syncPromise;
      });

      // При успехе isSyncingArchived не сбрасывается сразу — сбрасывается в handleRefreshComplete
      expect(result.current.isSyncingArchived).toBe(true);
    });
  });

  describe("handleRefreshComplete", () => {
    it("должен сбрасывать isSyncingArchived", async () => {
      mockTriggerSyncArchivedVacancyResponses.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(
        () =>
          useResponseActions(
            mockVacancyId,
            mockWorkspaceId,
            new Set(),
            mockSetSelectedIds,
          ),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.handleSyncArchived(mockWorkspaceId);
      });

      await waitFor(() => {
        expect(result.current.isSyncingArchived).toBe(true);
      });

      act(() => {
        result.current.handleRefreshComplete();
      });

      await waitFor(() => {
        expect(result.current.isSyncingArchived).toBe(false);
      });
    });

    it("должен вызывать invalidateQueries для vacancy.responses.list", () => {
      const { result } = renderHook(
        () =>
          useResponseActions(
            mockVacancyId,
            mockWorkspaceId,
            new Set(),
            mockSetSelectedIds,
          ),
        { wrapper: createWrapper() },
      );

      result.current.handleRefreshComplete();

      expect(invalidateQueriesSpy).toHaveBeenCalled();
    });
  });
});
