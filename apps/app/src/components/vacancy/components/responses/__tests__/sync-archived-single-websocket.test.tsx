/**
 * Тест проверяет, что при запуске синхронизации архивных откликов создаётся
 * только один WebSocket (одна подписка useInngestSubscription с enabled=true).
 *
 * Проблема: useSyncArchivedState и RefreshStatusIndicator оба подписываются на
 * канал sync archived, что создаёт два WebSocket. Нужен только один.
 */
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { ColumnId } from "../types";
import { VacancyResponsesProvider } from "../context/vacancy-responses-context";

function getRealContext() {
  const ctx = (globalThis as { __realVacancyResponsesContext?: object })
    .__realVacancyResponsesContext;
  if (!ctx)
    throw new Error(
      "__realVacancyResponsesContext not set — preload may have failed",
    );
  return ctx;
}
import { StatusIndicators } from "../status-indicators";
import { ResponseTableToolbar } from "../table/response-table-toolbar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockOnSyncArchived = mock(() => Promise.resolve());
const mockOnRefreshComplete = mock(() => {});

const defaultSubscriptionReturn = {
  data: [] as unknown[],
  error: null as Error | null,
  latestData: null as unknown,
  freshData: [] as unknown[],
  state: "closed" as const,
};

const mockUseInngestSubscription = mock((_opts: { enabled?: boolean }) => {
  return defaultSubscriptionReturn;
});

beforeEach(() => {
  mockUseInngestSubscription.mockClear();
  mockOnSyncArchived.mockClear();
  mockOnRefreshComplete.mockClear();

  mock.module("../context/vacancy-responses-context", () => getRealContext());
  mock.module(
    "~/components/vacancy/components/responses/context/vacancy-responses-context",
    () => getRealContext(),
  );

  mock.module("@bunworks/inngest-realtime/hooks", () => ({
    useInngestSubscription: mockUseInngestSubscription,
  }));

  mock.module("~/hooks/use-workspace", () => ({
    useWorkspace: () => ({
      workspace: { id: "ws-1", name: "Test" },
      orgSlug: "org",
    }),
  }));

  mock.module("~/trpc/react", () => ({
    useTRPC: () => ({
      vacancy: {
        responses: {
          getRefreshStatus: {
            queryOptions: (opts: { vacancyId: string }) => ({
              queryKey: ["vacancy", "responses", "getRefreshStatus", opts],
              queryFn: () =>
                Promise.resolve({
                  isRunning: false,
                  status: null,
                  message: null,
                  eventType: null,
                }),
            }),
          },
        },
      },
    }),
  }));

  mock.module("~/actions/trigger", () => ({
    triggerSyncArchivedVacancyResponses: () =>
      Promise.resolve({ eventId: "evt-1" }),
  }));
});

describe("синхронизация архивных откликов — один WebSocket", () => {
  const vacancyId = "vacancy-123";

  // TODO: падает при полном прогоне — mock use-sync-archived-state перезаписывает контекст
  it.skip("должен создавать только один WebSocket при запуске sync archived", async () => {
    const toolbarProps = {
      vacancyId,
      totalResponses: 0,
      screeningFilter: {} as never,
      onFilterChange: () => {},
      statusFilter: [] as never,
      onStatusFilterChange: () => {},
      search: "",
      onSearchChange: () => {},
      onRefresh: () => {},
      onRefreshComplete: mockOnRefreshComplete,
      onScreenNew: () => {},
      onScreenAll: () => {},
      onSyncArchived: mockOnSyncArchived,
      onScreeningComplete: () => {},
      visibleColumns: new Set() as ReadonlySet<ColumnId>,
      onToggleColumn: () => {},
      onResetColumns: () => {},
      isHHVacancy: true,
      isArchivedPublication: true,
      hasResponses: false,
      hasActiveIntegrations: true,
    };

    render(
      <TestWrapper>
        <VacancyResponsesProvider vacancyId={vacancyId}>
          <StatusIndicators />
          <ResponseTableToolbar {...toolbarProps} />
        </VacancyResponsesProvider>
      </TestWrapper>,
    );

    // 1. Открываем диалог подтверждения (клик на "Загрузить архивные отклики")
    const openButton = await screen.findByRole("button", {
      name: /загрузить архивные отклики/i,
    });
    await act(async () => {
      openButton.click();
    });

    // 2. Подтверждаем (клик по "Начать синхронизацию")
    const confirmButton = await screen.findByRole("button", {
      name: /начать синхронизацию/i,
    });
    await act(async () => {
      confirmButton.click();
    });

    await waitFor(() => {
      expect(mockOnSyncArchived).toHaveBeenCalled();
    });

    // 3. Считаем вызовы useInngestSubscription с enabled=true
    // mock.calls = [[opts], [opts], ...] — каждый вызов хранится как массив аргументов
    const callsWithEnabled = mockUseInngestSubscription.mock.calls.filter(
      (call: unknown[]) =>
        (call?.[0] as { enabled?: boolean })?.enabled === true,
    );
    expect(
      callsWithEnabled.length,
      `При sync archived должен создаваться только один WebSocket. Сейчас: ${callsWithEnabled.length}`,
    ).toBe(1);
  });
});
