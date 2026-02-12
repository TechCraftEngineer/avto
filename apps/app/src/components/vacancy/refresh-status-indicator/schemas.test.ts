import { describe, expect, it } from "bun:test";
import {
  analyzeProgressDataSchema,
  analyzeResultDataSchema,
  archivedResultDataSchema,
  archivedStatusDataSchema,
  progressDataSchema,
  progressStatusSchema,
  resultDataSchema,
} from "./schemas";

describe("progressStatusSchema", () => {
  it("должен валидировать started", () => {
    const result = progressStatusSchema.safeParse("started");
    expect(result.success).toBe(true);
  });

  it("должен валидировать processing", () => {
    const result = progressStatusSchema.safeParse("processing");
    expect(result.success).toBe(true);
  });

  it("должен валидировать completed", () => {
    const result = progressStatusSchema.safeParse("completed");
    expect(result.success).toBe(true);
  });

  it("должен валидировать error", () => {
    const result = progressStatusSchema.safeParse("error");
    expect(result.success).toBe(true);
  });

  it("должен отклонять невалидный статус", () => {
    const result = progressStatusSchema.safeParse("invalid");
    expect(result.success).toBe(false);
  });
});

describe("progressDataSchema", () => {
  it("должен валидировать корректные данные", () => {
    const result = progressDataSchema.safeParse({
      vacancyId: "v1",
      status: "processing",
      message: "Тест",
    });
    expect(result.success).toBe(true);
  });

  it("должен валидировать данные с опциональными полями", () => {
    const result = progressDataSchema.safeParse({
      vacancyId: "v1",
      status: "processing",
      message: "Тест",
      currentPage: 1,
      totalSaved: 10,
      totalSkipped: 2,
    });
    expect(result.success).toBe(true);
  });

  it("должен отклонять данные без vacancyId", () => {
    const result = progressDataSchema.safeParse({
      status: "processing",
      message: "Тест",
    });
    expect(result.success).toBe(false);
  });

  it("должен отклонять данные с невалидным статусом", () => {
    const result = progressDataSchema.safeParse({
      vacancyId: "v1",
      status: "invalid",
      message: "Тест",
    });
    expect(result.success).toBe(false);
  });
});

describe("archivedStatusDataSchema", () => {
  it("должен валидировать минимальные данные", () => {
    const result = archivedStatusDataSchema.safeParse({
      status: "processing",
      message: "Тест",
      vacancyId: "v1",
    });
    expect(result.success).toBe(true);
  });

  it("должен валидировать полные данные", () => {
    const result = archivedStatusDataSchema.safeParse({
      status: "completed",
      message: "Готово",
      vacancyId: "v1",
      syncedResponses: 50,
      newResponses: 10,
    });
    expect(result.success).toBe(true);
  });
});

describe("archivedResultDataSchema", () => {
  it("должен валидировать корректные данные", () => {
    const result = archivedResultDataSchema.safeParse({
      vacancyId: "v1",
      success: true,
      syncedResponses: 50,
      newResponses: 10,
      vacancyTitle: "Тестовая вакансия",
    });
    expect(result.success).toBe(true);
  });

  it("должен отклонять данные без success", () => {
    const result = archivedResultDataSchema.safeParse({
      vacancyId: "v1",
      syncedResponses: 50,
      newResponses: 10,
      vacancyTitle: "Тест",
    });
    expect(result.success).toBe(false);
  });
});

describe("analyzeProgressDataSchema", () => {
  it("должен валидировать корректные данные", () => {
    const result = analyzeProgressDataSchema.safeParse({
      vacancyId: "v1",
      status: "processing",
      message: "Анализ",
      total: 100,
      processed: 50,
      failed: 2,
    });
    expect(result.success).toBe(true);
  });

  it("должен валидировать данные с неполными опциональными полями", () => {
    const result = analyzeProgressDataSchema.safeParse({
      vacancyId: "v1",
      status: "started",
      message: "Начало",
    });
    expect(result.success).toBe(true);
  });
});

describe("analyzeResultDataSchema", () => {
  it("должен валидировать корректные данные", () => {
    const result = analyzeResultDataSchema.safeParse({
      vacancyId: "v1",
      success: true,
      total: 100,
      processed: 98,
      failed: 2,
    });
    expect(result.success).toBe(true);
  });

  it("должен отклонять данные без total", () => {
    const result = analyzeResultDataSchema.safeParse({
      vacancyId: "v1",
      success: true,
      processed: 50,
      failed: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("resultDataSchema", () => {
  it("должен валидировать успешный результат", () => {
    const result = resultDataSchema.safeParse({
      vacancyId: "v1",
      success: true,
      newCount: 10,
      totalResponses: 100,
    });
    expect(result.success).toBe(true);
  });

  it("должен валидировать результат с ошибкой", () => {
    const result = resultDataSchema.safeParse({
      vacancyId: "v1",
      success: false,
      newCount: 0,
      totalResponses: 100,
      error: "Ошибка",
    });
    expect(result.success).toBe(true);
  });

  it("должен отклонять данные без newCount", () => {
    const result = resultDataSchema.safeParse({
      vacancyId: "v1",
      success: true,
      totalResponses: 100,
    });
    expect(result.success).toBe(false);
  });
});
