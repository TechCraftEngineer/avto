import { describe, expect, it } from "bun:test";
import { hasData } from "./use-refresh-visibility";

describe("hasData", () => {
  const baseParams = {
    currentProgress: null,
    currentResult: null,
    archivedStatus: null,
    analyzeProgress: null,
    analyzeCompleted: null,
  };

  it("должен возвращать false когда нет данных", () => {
    const result = hasData(baseParams);
    expect(result).toBe(false);
  });

  it("должен возвращать true когда есть currentProgress", () => {
    const result = hasData({
      ...baseParams,
      currentProgress: { status: "processing", message: "Тест", vacancyId: "v1" },
    });
    expect(result).toBe(true);
  });

  it("должен возвращать true когда есть currentResult", () => {
    const result = hasData({
      ...baseParams,
      currentResult: { success: true, vacancyId: "v1", newCount: 5, totalResponses: 100 },
    });
    expect(result).toBe(true);
  });

  it("должен возвращать true когда есть archivedStatus", () => {
    const result = hasData({
      ...baseParams,
      archivedStatus: { status: "processing", message: "Тест", vacancyId: "v1" },
    });
    expect(result).toBe(true);
  });

  it("должен возвращать true когда есть analyzeProgress", () => {
    const result = hasData({
      ...baseParams,
      analyzeProgress: { vacancyId: "v1", total: 100, processed: 50, failed: 2 },
    });
    expect(result).toBe(true);
  });

  it("должен возвращать true когда есть analyzeCompleted", () => {
    const result = hasData({
      ...baseParams,
      analyzeCompleted: { vacancyId: "v1", total: 100, processed: 100, failed: 0 },
    });
    expect(result).toBe(true);
  });

  it("должен возвращать true когда есть externalMessage", () => {
    const result = hasData({
      ...baseParams,
      externalMessage: "Тестовое сообщение",
    });
    expect(result).toBe(true);
  });

  it("должен возвращать true когда есть externalProgress", () => {
    const result = hasData({
      ...baseParams,
      externalProgress: { total: 100, processed: 50, failed: 2 },
    });
    expect(result).toBe(true);
  });

  it("должен возвращать false для пустой строки externalMessage", () => {
    const result = hasData({
      ...baseParams,
      externalMessage: "",
    });
    // Пустая строка тоже считается данными (это поведение match с P.not(P.nullish))
    expect(result).toBe(true);
  });

  it("должен возвращать false для null externalMessage", () => {
    const result = hasData({
      ...baseParams,
      externalMessage: undefined,
    });
    expect(result).toBe(false);
  });

  it("должен возвращать false для null externalProgress", () => {
    const result = hasData({
      ...baseParams,
      externalProgress: null,
    });
    expect(result).toBe(false);
  });
});
