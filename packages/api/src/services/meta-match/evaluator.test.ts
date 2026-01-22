import { describe, expect, it } from "vitest";
import {
  determinePhase,
  evaluateMetaMatch,
  getMetaMatchStatus,
  getRiskFlags,
  getSummaryLabels,
} from "./evaluator";

describe("Meta-Match evaluator", () => {
  it("определяет фазу цикла корректно", () => {
    expect(determinePhase(0)).toBe("stabilization");
    expect(determinePhase(2)).toBe("stabilization");
    expect(determinePhase(3)).toBe("growth");
    expect(determinePhase(5)).toBe("growth");
    expect(determinePhase(6)).toBe("change");
    expect(determinePhase(8)).toBe("change");
  });

  it("вычисляет метрики в диапазоне 0–10", () => {
    const report = evaluateMetaMatch(
      new Date("1990-04-21T00:00:00.000Z"),
      new Date("2025-01-01T00:00:00.000Z"),
    );

    const metrics = Object.values(report.summaryMetrics);
    for (const metric of metrics) {
      expect(metric).toBeGreaterThanOrEqual(0);
      expect(metric).toBeLessThanOrEqual(10);
    }

    expect(report.narrative.length).toBeGreaterThanOrEqual(2);
    expect(report.narrative.length).toBeLessThanOrEqual(4);
    expect(report.recommendations).toHaveLength(2);
    expect(report.algorithmVersion).toBe("v1");
  });

  it("формирует текстовые интерпретации метрик", () => {
    const labels = getSummaryLabels({
      synergy: 9,
      temporalResonance: 6,
      conflictRisk: 2,
      moneyFlow: 10,
    });

    expect(labels.synergy).toBe("высокий");
    expect(labels.temporalResonance).toBe("средний");
    expect(labels.conflictRisk).toBe("низкий");
    expect(labels.moneyFlow).toBe("высокий");
  });

  it("возвращает риск-флаги для критичных значений", () => {
    const flags = getRiskFlags({
      synergy: 2,
      temporalResonance: 2,
      conflictRisk: 8,
      moneyFlow: 2,
    });

    expect(flags.length).toBeGreaterThan(0);
  });

  it("возвращает нейтральный статус при отсутствии даты рождения", () => {
    expect(getMetaMatchStatus(false, false)).toBe("no_data");
    expect(getMetaMatchStatus(false, true)).toBe("needs_evaluation");
    expect(getMetaMatchStatus(true, true)).toBe("ready");
  });
});
