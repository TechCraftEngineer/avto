import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { MessageHandlerContext } from "./subscription-handlers";
import {
  handleArchivedProgress,
  handleArchivedResult,
  handleRefreshProgress,
  handleRefreshResult,
} from "./subscription-handlers";

const mockSetArchivedStatus = mock(() => {});
const mockOnVisibilityChange = mock(() => {});
const mockOnTaskComplete = mock(() => {});
const mockSetAutoCloseTimer = mock(() => {});
const mockInvalidateQueries = mock(() => Promise.resolve());

const mockSetCurrentProgress = mock(() => {});
const mockSetCurrentResult = mock(() => {});

const createContext = () => ({
  vacancyId: "vacancy-123",
  queryClient: {
    invalidateQueries: mockInvalidateQueries,
  },
  trpc: {
    vacancy: {
      responses: {
        list: { queryKey: (i: { vacancyId: string }) => ["responses", i.vacancyId] },
        getRefreshStatus: {
          queryKey: (i: { vacancyId: string }) => ["refreshStatus", i.vacancyId],
        },
      },
    },
  },
  onVisibilityChange: mockOnVisibilityChange,
  onTaskComplete: mockOnTaskComplete,
  setArchivedStatus: mockSetArchivedStatus,
  setAnalyzeProgress: mock(() => {}),
  setAnalyzeCompleted: mock(() => {}),
  setCurrentProgress: mockSetCurrentProgress,
  setCurrentResult: mockSetCurrentResult,
  setAutoCloseTimer: mockSetAutoCloseTimer,
});

beforeEach(() => {
  mockSetArchivedStatus.mockClear();
  mockSetCurrentProgress.mockClear();
  mockSetCurrentResult.mockClear();
  mockOnVisibilityChange.mockClear();
  mockOnTaskComplete.mockClear();
  mockSetAutoCloseTimer.mockClear();
  mockInvalidateQueries.mockClear();
});

describe("handleArchivedProgress", () => {
  it("должен вызывать setArchivedStatus с данными прогресса", () => {
    const context = createContext();
    const message = {
      data: {
        status: "processing",
        message: "Обработка откликов",
        vacancyId: "vacancy-123",
        syncedResponses: 10,
        newResponses: 5,
      },
    };

    handleArchivedProgress(message, context as unknown as MessageHandlerContext);

    expect(mockSetArchivedStatus).toHaveBeenCalledWith({
      status: "processing",
      message: "Обработка откликов",
      vacancyId: "vacancy-123",
      syncedResponses: 10,
      newResponses: 5,
    });
    expect(mockOnVisibilityChange).toHaveBeenCalledWith(true);
  });

  it("должен вызывать setAutoCloseTimer для очистки таймера", () => {
    const context = createContext();
    const message = {
      data: {
        status: "processing",
        message: "Обработка",
        vacancyId: "vacancy-123",
      },
    };

    handleArchivedProgress(message, context as unknown as MessageHandlerContext);

    expect(mockSetAutoCloseTimer).toHaveBeenCalled();
  });

  it("не должен вызывать setArchivedStatus при невалидных данных", () => {
    const context = createContext();
    const message = {
      data: {
        message: "Обработка",
        vacancyId: "vacancy-123",
        // отсутствует status
      },
    };

    handleArchivedProgress(message, context as unknown as MessageHandlerContext);

    expect(mockSetArchivedStatus).not.toHaveBeenCalled();
  });

  it("не должен инвалидировать vacancy.responses.list при каждом progress — только при result", () => {
    const context = createContext();

    // Парсер шлёт progress после КАЖДОГО отклика — симулируем 50 сообщений
    for (let i = 1; i <= 50; i++) {
      handleArchivedProgress(
        {
          data: {
            status: "processing",
            message: `Обработан отклик ${i}`,
            vacancyId: "vacancy-123",
            syncedResponses: i,
            newResponses: 0,
          },
        },
        context as unknown as MessageHandlerContext,
      );
    }

    // После 50 progress-сообщений invalidateQueries не должен вызываться
    expect(mockInvalidateQueries).not.toHaveBeenCalled();

    // Инвалидация только при result
    handleArchivedResult(
      {
        data: {
          vacancyId: "vacancy-123",
          success: true,
          syncedResponses: 50,
          newResponses: 10,
          vacancyTitle: "Test",
        },
      },
      context as any,
    );

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2);
  });
});

describe("handleArchivedResult", () => {
  it("должен вызывать setArchivedStatus с completed и инвалидировать кэш", () => {
    const context = createContext();
    const message = {
      data: {
        vacancyId: "vacancy-123",
        success: true,
        syncedResponses: 20,
        newResponses: 10,
        vacancyTitle: "Test Vacancy",
      },
    };

    handleArchivedResult(message, context as unknown as MessageHandlerContext);

    expect(mockSetArchivedStatus).toHaveBeenCalledWith({
      status: "completed",
      message: "Синхронизация завершена. Обработано: 20, новых: 10",
      vacancyId: "vacancy-123",
      syncedResponses: 20,
      newResponses: 10,
    });
    expect(mockOnVisibilityChange).toHaveBeenCalledWith(true);
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2);
  });

  it("должен вызывать setAutoCloseTimer для закрытия через 3 секунды", () => {
    const context = createContext();
    const message = {
      data: {
        vacancyId: "vacancy-123",
        success: true,
        syncedResponses: 15,
        newResponses: 3,
        vacancyTitle: "Test",
      },
    };

    handleArchivedResult(message, context as unknown as MessageHandlerContext);

    expect(mockSetAutoCloseTimer).toHaveBeenCalled();
  });

  it("не должен вызывать setArchivedStatus при невалидных данных", () => {
    const context = createContext();
    const message = {
      data: {
        vacancyId: "vacancy-123",
        // отсутствуют success, syncedResponses, newResponses, vacancyTitle
      },
    };

    handleArchivedResult(message, context as unknown as MessageHandlerContext);

    expect(mockSetArchivedStatus).not.toHaveBeenCalled();
  });
});

describe("handleRefreshProgress (refresh + screening)", () => {
  it("должен вызывать setCurrentProgress с данными прогресса", () => {
    const context = createContext();
    const message = {
      data: {
        vacancyId: "vacancy-123",
        status: "processing",
        message: "Обработка страницы 2",
        currentPage: 2,
        totalSaved: 50,
        totalSkipped: 10,
      },
    };

    handleRefreshProgress(message, context as unknown as MessageHandlerContext);

    expect(mockSetCurrentProgress).toHaveBeenCalledWith({
      vacancyId: "vacancy-123",
      status: "processing",
      message: "Обработка страницы 2",
      currentPage: 2,
      totalSaved: 50,
      totalSkipped: 10,
    });
    expect(mockOnVisibilityChange).toHaveBeenCalledWith(true);
  });

  it("не должен инвалидировать vacancy.responses.list при каждом progress — только при result", () => {
    const context = createContext();

    for (let i = 1; i <= 50; i++) {
      handleRefreshProgress(
        {
          data: {
            vacancyId: "vacancy-123",
            status: "processing",
            message: `Обработана страница ${i}`,
            currentPage: i,
            totalSaved: i * 10,
            totalSkipped: 0,
          },
        },
        context as unknown as MessageHandlerContext,
      );
    }

    expect(mockInvalidateQueries).not.toHaveBeenCalled();

    handleRefreshResult(
      {
        data: {
          vacancyId: "vacancy-123",
          success: true,
          newCount: 5,
          totalResponses: 100,
        },
      },
      context as any,
    );

    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2);
  });
});

describe("handleRefreshResult", () => {
  it("должен вызывать setCurrentResult и инвалидировать кэш", () => {
    const context = createContext();
    const message = {
      data: {
        vacancyId: "vacancy-123",
        success: true,
        newCount: 10,
        totalResponses: 50,
      },
    };

    handleRefreshResult(message, context as unknown as MessageHandlerContext);

    expect(mockSetCurrentResult).toHaveBeenCalledWith({
      vacancyId: "vacancy-123",
      success: true,
      newCount: 10,
      totalResponses: 50,
    });
    expect(mockOnVisibilityChange).toHaveBeenCalledWith(true);
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(2);
  });
});
