/**
 * Тест проверяет, что при запуске скрининга новых откликов создаётся
 * только один WebSocket (одна подписка useInngestSubscription с enabled=true).
 *
 * Проблема: useScreeningState и RefreshStatusIndicator оба могут подписываться
 * на канал screen-new, что создаёт два WebSocket. Нужен только один.
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

function ScreeningTestTrigger() {
  const screenNewOp = useVacancyOperation("screenNew");
  return (
    <button
      type="button"
      onClick={() => screenNewOp.openConfirmation()}
      data-testid="open-screening"
    >
      Открыть скрининг
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

const mockOnScreenNew = mock(() => Promise.resolve());
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
  mockOnScreenNew.mockClear();
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
    channel: "screen-new",
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
});

describe("скрининг новых откликов — один WebSocket", () => {
  const vacancyId = "vacancy-123";

  it("должен создавать только один WebSocket при запуске screen new", async () => {
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
      onScreenNew: mockOnScreenNew,
      onScreenAll: () => {},
      onSyncArchived: () => {},
      onScreeningComplete: mockOnScreeningComplete,
      visibleColumns: new Set() as ReadonlySet<ColumnId>,
      onToggleColumn: () => {},
      onResetColumns: () => {},
      isHHVacancy: true,
      isArchivedPublication: false,
      hasResponses: true,
      hasActiveIntegrations: true,
    };

    render(
      <TestWrapper>
        <VacancyResponsesProvider vacancyId={vacancyId}>
          <StatusIndicators />
          <ResponseTableToolbar {...toolbarProps} />
          <ScreeningTestTrigger />
        </VacancyResponsesProvider>
      </TestWrapper>,
    );

    // 1. Открываем диалог подтверждения (обходим dropdown из-за MutationObserver в happy-dom)
    const openButton = screen.getByTestId("open-screening");
    await act(async () => {
      openButton.click();
    });

    // 2. Подтверждаем (клик по "Начать скрининг")
    const confirmButton = await screen.findByRole("button", {
      name: /начать скрининг/i,
    });
    await act(async () => {
      confirmButton.click();
    });

    await waitFor(() => {
      expect(mockOnScreenNew).toHaveBeenCalled();
    });

    // 4. Считаем вызовы useInngestSubscription с enabled=true
    const callsWithEnabled = mockUseInngestSubscription.mock.calls.filter(
      (call: unknown[]) =>
        (call?.[0] as { enabled?: boolean })?.enabled === true,
    );
    expect(
      callsWithEnabled.length,
      `При screen new должен создаваться только один WebSocket. Сейчас: ${callsWithEnabled.length}`,
    ).toBe(1);
  });
});
