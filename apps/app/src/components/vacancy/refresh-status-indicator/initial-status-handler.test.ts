import { beforeEach, describe, expect, it, mock } from "bun:test";
import { restoreProgressFromInitialStatus } from "./initial-status-handler";

describe("restoreProgressFromInitialStatus", () => {
  const mockSetArchivedStatus = mock(() => {});
  const mockSetCurrentProgress = mock(() => {});
  const mockSetAnalyzeProgress = mock(() => {});
  const vacancyId = "vacancy-123";

  const createHandlers = () => ({
    setArchivedStatus: mockSetArchivedStatus,
    setCurrentProgress: mockSetCurrentProgress,
    setAnalyzeProgress: mockSetAnalyzeProgress,
  });

  beforeEach(() => {
    mockSetArchivedStatus.mockClear();
    mockSetCurrentProgress.mockClear();
    mockSetAnalyzeProgress.mockClear();
  });

  it("должен устанавливать archivedStatus для sync-archived события с прогрессом", () => {
    const handlers = createHandlers();
    const initialStatus = {
      isRunning: true,
      status: "processing",
      message: "Синхронизация архивных откликов",
      eventType: "vacancy/responses.sync-archived",
      progress: {
        totalSaved: 50,
        newCount: 10,
      },
    };

    restoreProgressFromInitialStatus(initialStatus, vacancyId, handlers);

    expect(mockSetArchivedStatus).toHaveBeenCalledWith({
      status: "processing",
      message: "Синхронизация архивных откликов",
      vacancyId: "vacancy-123",
      syncedResponses: 50,
      newResponses: 10,
    });
  });

  it("должен устанавливать archivedStatus для sync-archived события без прогресса", () => {
    const handlers = createHandlers();
    const initialStatus = {
      isRunning: true,
      status: "processing",
      message: "Синхронизация",
      eventType: "vacancy/responses.sync-archived",
    };

    restoreProgressFromInitialStatus(initialStatus, vacancyId, handlers);

    expect(mockSetArchivedStatus).toHaveBeenCalledWith({
      status: "processing",
      message: "Синхронизация",
      vacancyId: "vacancy-123",
    });
  });

  it("должен устанавливать currentProgress для refresh события с прогрессом", () => {
    const handlers = createHandlers();
    const initialStatus = {
      isRunning: true,
      status: "processing",
      message: "Получение откликов",
      eventType: "vacancy/responses.refresh",
      progress: {
        currentPage: 2,
        totalSaved: 25,
        totalSkipped: 5,
      },
    };

    restoreProgressFromInitialStatus(initialStatus, vacancyId, handlers);

    expect(mockSetCurrentProgress).toHaveBeenCalledWith({
      status: "processing",
      message: "Получение откликов",
      vacancyId: "vacancy-123",
      currentPage: 2,
      totalSaved: 25,
      totalSkipped: 5,
    });
  });

  it("должен устанавливать currentProgress для screen.new события с прогрессом", () => {
    const handlers = createHandlers();
    const initialStatus = {
      isRunning: true,
      status: "processing",
      message: "Скрининг откликов",
      eventType: "response/screen.new",
      progress: {
        currentPage: 1,
        totalSaved: 15,
        totalSkipped: 3,
      },
    };

    restoreProgressFromInitialStatus(initialStatus, vacancyId, handlers);

    expect(mockSetCurrentProgress).toHaveBeenCalledWith({
      status: "processing",
      message: "Скрининг откликов",
      vacancyId: "vacancy-123",
      currentPage: 1,
      totalSaved: 15,
      totalSkipped: 3,
    });
  });

  it("должен устанавливать analyzeProgress для screen.batch события с прогрессом", () => {
    const handlers = createHandlers();
    const initialStatus = {
      isRunning: true,
      status: "processing",
      message: "Анализ откликов",
      eventType: "response/screen.batch",
      progress: {
        total: 100,
        processed: 50,
        failed: 2,
      },
    };

    restoreProgressFromInitialStatus(initialStatus, vacancyId, handlers);

    expect(mockSetAnalyzeProgress).toHaveBeenCalledWith({
      vacancyId: "vacancy-123",
      total: 100,
      processed: 50,
      failed: 2,
    });
  });

  it("не должен вызывать никакие handlers без progress", () => {
    const handlers = createHandlers();
    const initialStatus = {
      isRunning: true,
      status: "processing",
      message: "Тест",
      eventType: null,
    };

    restoreProgressFromInitialStatus(initialStatus, vacancyId, handlers);

    expect(mockSetArchivedStatus).not.toHaveBeenCalled();
    expect(mockSetCurrentProgress).not.toHaveBeenCalled();
    expect(mockSetAnalyzeProgress).not.toHaveBeenCalled();
  });

  it("не должен вызывать никакие handlers для нераспознанного eventType", () => {
    const handlers = createHandlers();
    const initialStatus = {
      isRunning: true,
      status: "processing",
      message: "Тест",
      eventType: "unknown/event",
      progress: {
        totalSaved: 10,
      },
    };

    restoreProgressFromInitialStatus(initialStatus, vacancyId, handlers);

    expect(mockSetArchivedStatus).not.toHaveBeenCalled();
    expect(mockSetCurrentProgress).not.toHaveBeenCalled();
    expect(mockSetAnalyzeProgress).not.toHaveBeenCalled();
  });
});
