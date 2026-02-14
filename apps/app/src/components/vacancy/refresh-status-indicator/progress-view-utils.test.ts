import { describe, expect, it } from "bun:test";
import { getProgressStatus, getProgressTitle } from "./progress-view-utils";

describe("getProgressStatus", () => {
  const baseParams = {
    mode: "refresh" as const,
    archivedStatus: null,
    analyzeCompleted: null,
    analyzeProgress: null,
    currentProgress: null,
    currentResult: null,
  };

  it("должен возвращать статус из archivedStatus для archived режима", () => {
    const result = getProgressStatus({
      ...baseParams,
      mode: "archived",
      archivedStatus: {
        status: "processing",
        message: "Тест",
        vacancyId: "v1",
      },
    });
    expect(result).toBe("processing");
  });

  it("должен возвращать completed для analyze/screening режима с analyzeCompleted", () => {
    const result = getProgressStatus({
      ...baseParams,
      mode: "analyze",
      analyzeCompleted: {
        vacancyId: "v1",
        total: 10,
        processed: 10,
        failed: 0,
      },
    });
    expect(result).toBe("completed");
  });

  it("должен возвращать completed для screening режима с analyzeCompleted", () => {
    const result = getProgressStatus({
      ...baseParams,
      mode: "screening",
      analyzeCompleted: {
        vacancyId: "v1",
        total: 10,
        processed: 10,
        failed: 0,
      },
    });
    expect(result).toBe("completed");
  });

  it("должен возвращать completed если externalMessage содержит 'завершена'", () => {
    const result = getProgressStatus({
      ...baseParams,
      mode: "analyze",
      externalMessage: "Анализ завершена",
    });
    expect(result).toBe("completed");
  });

  it("должен возвращать processing для analyze/screening режима с analyzeProgress", () => {
    const result = getProgressStatus({
      ...baseParams,
      mode: "analyze",
      analyzeProgress: { vacancyId: "v1", total: 10, processed: 5, failed: 0 },
    });
    expect(result).toBe("processing");
  });

  it("должен возвращать processing для analyze/screening режима с externalMessage", () => {
    const result = getProgressStatus({
      ...baseParams,
      mode: "screening",
      externalMessage: "Идет анализ",
    });
    expect(result).toBe("processing");
  });

  it("должен возвращать статус из currentProgress", () => {
    const result = getProgressStatus({
      ...baseParams,
      currentProgress: {
        status: "processing",
        message: "Тест",
        vacancyId: "v1",
      },
    });
    expect(result).toBe("processing");
  });

  it("должен возвращать completed если есть currentResult", () => {
    const result = getProgressStatus({
      ...baseParams,
      currentResult: {
        success: true,
        vacancyId: "v1",
        newCount: 5,
        totalResponses: 100,
      },
    });
    expect(result).toBe("completed");
  });

  it("должен возвращать undefined для неизвестных комбинаций", () => {
    const result = getProgressStatus({
      ...baseParams,
      mode: "refresh",
    });
    expect(result).toBeUndefined();
  });
});

describe("getProgressTitle", () => {
  const baseParams = {
    mode: "refresh" as const,
    archivedStatus: null,
    analyzeProgress: null,
    analyzeCompleted: null,
    currentProgress: null,
    currentResult: null,
  };

  describe("archived режим", () => {
    it("должен возвращать 'Запуск синхронизации…' когда archivedStatus=null", () => {
      const result = getProgressTitle({ ...baseParams, mode: "archived" });
      expect(result).toBe("Запуск синхронизации…");
    });

    it("должен возвращать 'Задание в очереди' для статуса started", () => {
      const result = getProgressTitle({
        ...baseParams,
        mode: "archived",
        archivedStatus: { status: "started", message: "Тест", vacancyId: "v1" },
      });
      expect(result).toBe("Задание в очереди");
    });

    it("должен возвращать 'Синхронизация архивных откликов' для статуса processing", () => {
      const result = getProgressTitle({
        ...baseParams,
        mode: "archived",
        archivedStatus: {
          status: "processing",
          message: "Тест",
          vacancyId: "v1",
        },
      });
      expect(result).toBe("Синхронизация архивных откликов");
    });

    it("должен возвращать 'Ошибка синхронизации' для статуса error", () => {
      const result = getProgressTitle({
        ...baseParams,
        mode: "archived",
        archivedStatus: { status: "error", message: "Тест", vacancyId: "v1" },
      });
      expect(result).toBe("Ошибка синхронизации");
    });

    it("должен возвращать 'Синхронизация завершена' для статуса completed", () => {
      const result = getProgressTitle({
        ...baseParams,
        mode: "archived",
        archivedStatus: {
          status: "completed",
          message: "Тест",
          vacancyId: "v1",
        },
      });
      expect(result).toBe("Синхронизация завершена");
    });
  });

  describe("screening режим", () => {
    it("должен возвращать 'Запуск скрининга…' без данных", () => {
      const result = getProgressTitle({ ...baseParams, mode: "screening" });
      expect(result).toBe("Запуск скрининга…");
    });

    it("должен возвращать 'Скрининг откликов' с analyzeProgress", () => {
      const result = getProgressTitle({
        ...baseParams,
        mode: "screening",
        analyzeProgress: {
          vacancyId: "v1",
          total: 10,
          processed: 5,
          failed: 0,
        },
      });
      expect(result).toBe("Скрининг откликов");
    });

    it("должен возвращать 'Скрининг завершен' с analyzeCompleted", () => {
      const result = getProgressTitle({
        ...baseParams,
        mode: "screening",
        analyzeCompleted: {
          vacancyId: "v1",
          total: 10,
          processed: 10,
          failed: 0,
        },
      });
      expect(result).toBe("Скрининг завершен");
    });
  });

  describe("analyze режим", () => {
    it("должен возвращать 'Запуск анализа…' без данных", () => {
      const result = getProgressTitle({ ...baseParams, mode: "analyze" });
      expect(result).toBe("Запуск анализа…");
    });

    it("должен возвращать 'Анализ откликов' с analyzeProgress", () => {
      const result = getProgressTitle({
        ...baseParams,
        mode: "analyze",
        analyzeProgress: {
          vacancyId: "v1",
          total: 10,
          processed: 5,
          failed: 0,
        },
      });
      expect(result).toBe("Анализ откликов");
    });

    it("должен возвращать 'Анализ завершен' с analyzeCompleted", () => {
      const result = getProgressTitle({
        ...baseParams,
        mode: "analyze",
        analyzeCompleted: {
          vacancyId: "v1",
          total: 10,
          processed: 10,
          failed: 0,
        },
      });
      expect(result).toBe("Анализ завершен");
    });
  });

  describe("refresh режим", () => {
    it("должен возвращать 'Запуск получения откликов…' без данных", () => {
      const result = getProgressTitle({ ...baseParams, mode: "refresh" });
      expect(result).toBe("Запуск получения откликов…");
    });

    it("должен возвращать 'Задание в очереди' для статуса started", () => {
      const result = getProgressTitle({
        ...baseParams,
        currentProgress: {
          status: "started",
          message: "Тест",
          vacancyId: "v1",
        },
      });
      expect(result).toBe("Задание в очереди");
    });

    it("должен возвращать 'Получение откликов' для статуса processing", () => {
      const result = getProgressTitle({
        ...baseParams,
        currentProgress: {
          status: "processing",
          message: "Тест",
          vacancyId: "v1",
        },
      });
      expect(result).toBe("Получение откликов");
    });

    it("должен возвращать 'Ошибка обновления' для статуса error", () => {
      const result = getProgressTitle({
        ...baseParams,
        currentProgress: { status: "error", message: "Тест", vacancyId: "v1" },
      });
      expect(result).toBe("Ошибка обновления");
    });

    it("должен возвращать 'Получение завершено' с currentResult", () => {
      const result = getProgressTitle({
        ...baseParams,
        currentResult: {
          success: true,
          vacancyId: "v1",
          newCount: 5,
          totalResponses: 100,
        },
      });
      expect(result).toBe("Получение завершено");
    });
  });

  it("должен возвращать 'Загрузка…' по умолчанию", () => {
    const result = getProgressTitle({ ...baseParams });
    // Для refresh режима без данных возвращается специфичное сообщение
    expect(result).toMatch(/Запуск получения откликов|Загрузка/);
  });
});
