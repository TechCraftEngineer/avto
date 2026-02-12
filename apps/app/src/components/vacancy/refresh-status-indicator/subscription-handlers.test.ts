import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
  handleArchivedProgress,
  handleArchivedResult,
} from "./subscription-handlers";

const mockSetArchivedStatus = mock(() => {});
const mockOnVisibilityChange = mock(() => {});
const mockOnTaskComplete = mock(() => {});
const mockSetAutoCloseTimer = mock(() => {});
const mockInvalidateQueries = mock(() => Promise.resolve());

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
  setCurrentProgress: mock(() => {}),
  setCurrentResult: mock(() => {}),
  setAutoCloseTimer: mockSetAutoCloseTimer,
});

beforeEach(() => {
  mockSetArchivedStatus.mockClear();
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

    handleArchivedProgress(message, context as any);

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

    handleArchivedProgress(message, context as any);

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

    handleArchivedProgress(message, context as any);

    expect(mockSetArchivedStatus).not.toHaveBeenCalled();
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

    handleArchivedResult(message, context as any);

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

    handleArchivedResult(message, context as any);

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

    handleArchivedResult(message, context as any);

    expect(mockSetArchivedStatus).not.toHaveBeenCalled();
  });
});
