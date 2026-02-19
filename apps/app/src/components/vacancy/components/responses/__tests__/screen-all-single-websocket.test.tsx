/**
 * Тест проверяет, что при запуске анализа всех откликов (screen-all) создаётся
 * только один WebSocket (одна подписка useInngestSubscription с enabled=true).
 *
 * ПРИЧИНА ДВУХ WebSocket:
 *
 * 1. useScreeningState (type="all") в ResponseTableToolbar
 *    → useScreeningSubscription(fetchScreenAllResponsesToken)
 *    → enabled при subscriptionActive (handleClick ставит true после подтверждения)
 *
 * 2. RefreshStatusIndicator (mode="analyze") в StatusIndicators
 *    → useRefreshSubscription.analyzeSubscription(fetchScreenAllResponsesToken)
 *    → enabled при taskStarted (handleStartRefresh ставит true при клике "Начать анализ")
 *
 * Оба источника включаются одновременно при подтверждении диалога → два WebSocket
 * на один канал screen-all-responses.
 *
 * Фикс: по аналогии с sync-archived — отключить useScreeningSubscription
 * в useScreeningState, оставив только analyzeSubscription в RefreshStatusIndicator.
 */
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { ColumnId } from "../types";
import {
  VacancyResponsesProvider,
  useVacancyOperation,
} from "../context/vacancy-responses-context";
import { StatusIndicators } from "../status-indicators";
import { ResponseTableToolbar } from "../table/response-table-toolbar";

function AnalyzeTestTrigger() {
  const screenAllOp = useVacancyOperation("screenAll");
  return (
    <button
      type="button"
      onClick={() => screenAllOp.openConfirmation()}
      data-testid="open-analyze"
    >
      Открыть анализ
    </button>
  );
}

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

const mockOnScreenAll = mock(() => Promise.resolve());
const mockOnScreeningComplete = mock(() => {});

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
  mockOnScreenAll.mockClear();
  mockOnScreeningComplete.mockClear();

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

  const mockToken = {
    channel: "screen-all",
    topics: ["progress", "result"],
    key: "token",
  };
  mock.module("~/actions/realtime", () => {
    const tokenFn = () => Promise.resolve(mockToken);
    return {
      fetchSyncArchivedVacancyResponsesToken: tokenFn,
      fetchRefreshVacancyResponsesToken: tokenFn,
      fetchScreenNewResponsesToken: tokenFn,
      fetchScreenAllResponsesToken: tokenFn,
    };
  });

  mock.module("~/actions/trigger", () => ({
    triggerScreenAllResponses: () => Promise.resolve({ eventId: "evt-1" }),
  }));
});

describe("screen-all (анализ всех откликов) — один WebSocket", () => {
  const vacancyId = "vacancy-123";

  it("должен создавать только один WebSocket при запуске analyze", async () => {
    const toolbarProps = {
      vacancyId,
      totalResponses: 10,
      screeningFilter: {} as never,
      onFilterChange: () => {},
      statusFilter: [] as never,
      onStatusFilterChange: () => {},
      search: "",
      onSearchChange: () => {},
      onRefresh: () => {},
      onRefreshComplete: () => {},
      onScreenNew: () => {},
      onScreenAll: mockOnScreenAll,
      onSyncArchived: () => {},
      onScreeningComplete: mockOnScreeningComplete,
      visibleColumns: new Set() as ReadonlySet<ColumnId>,
      onToggleColumn: () => {},
      onResetColumns: () => {},
      isHHVacancy: true,
      isArchivedPublication: true,
      hasResponses: true,
      hasActiveIntegrations: true,
    };

    render(
      <TestWrapper>
        <VacancyResponsesProvider vacancyId={vacancyId}>
          <StatusIndicators />
          <ResponseTableToolbar {...toolbarProps} />
          <AnalyzeTestTrigger />
        </VacancyResponsesProvider>
      </TestWrapper>,
    );

    // 1. Открываем диалог подтверждения
    const openButton = screen.getByTestId("open-analyze");
    await act(async () => {
      openButton.click();
    });

    // 2. Подтверждаем (клик по "Начать анализ")
    const confirmButton = await screen.findByRole("button", {
      name: /начать анализ/i,
    });
    await act(async () => {
      confirmButton.click();
    });

    await waitFor(() => {
      expect(mockOnScreenAll).toHaveBeenCalled();
    });

    // 3. Считаем вызовы useInngestSubscription с enabled=true
    const callsWithEnabled = mockUseInngestSubscription.mock.calls.filter(
      (call: unknown[]) =>
        (call?.[0] as { enabled?: boolean })?.enabled === true,
    );
    expect(
      callsWithEnabled.length,
      `При screen-all должен создаваться только один WebSocket. Сейчас: ${callsWithEnabled.length}. ` +
        `Причина: useScreeningState + RefreshStatusIndicator оба подписываются на fetchScreenAllResponsesToken.`,
    ).toBe(1);
  });
});
