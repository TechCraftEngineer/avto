import { describe, expect, it } from "bun:test";

describe("Базовые тесты", () => {
  it("должен проходить простой тест", () => {
    expect(1 + 1).toBe(2);
  });

  it("должен проверять строки", () => {
    expect("тест").toBe("тест");
  });

  it("должен проверять массивы", () => {
    expect([1, 2, 3]).toHaveLength(3);
  });
});
