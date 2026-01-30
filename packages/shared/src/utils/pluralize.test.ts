import { describe, expect, it } from "bun:test";
import { pluralize } from "./pluralize";

describe("pluralize", () => {
  it("должен возвращать форму 'one' для чисел, оканчивающихся на 1 (кроме 11)", () => {
    expect(pluralize(1, "день", "дня", "дней")).toBe("день");
    expect(pluralize(21, "день", "дня", "дней")).toBe("день");
    expect(pluralize(31, "день", "дня", "дней")).toBe("день");
    expect(pluralize(101, "день", "дня", "дней")).toBe("день");
  });

  it("должен возвращать форму 'few' для чисел, оканчивающихся на 2-4 (кроме 12-14)", () => {
    expect(pluralize(2, "день", "дня", "дней")).toBe("дня");
    expect(pluralize(3, "день", "дня", "дней")).toBe("дня");
    expect(pluralize(4, "день", "дня", "дней")).toBe("дня");
    expect(pluralize(22, "день", "дня", "дней")).toBe("дня");
    expect(pluralize(23, "день", "дня", "дней")).toBe("дня");
    expect(pluralize(24, "день", "дня", "дней")).toBe("дня");
    expect(pluralize(102, "день", "дня", "дней")).toBe("дня");
  });

  it("должен возвращать форму 'many' для чисел, оканчивающихся на 0, 5-9", () => {
    expect(pluralize(0, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(5, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(6, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(7, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(8, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(9, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(10, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(20, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(25, "день", "дня", "дней")).toBe("дней");
  });

  it("должен возвращать форму 'many' для чисел 11-14", () => {
    expect(pluralize(11, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(12, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(13, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(14, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(111, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(112, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(113, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(114, "день", "дня", "дней")).toBe("дней");
  });

  it("должен работать с отрицательными числами", () => {
    expect(pluralize(-1, "день", "дня", "дней")).toBe("день");
    expect(pluralize(-2, "день", "дня", "дней")).toBe("дня");
    expect(pluralize(-5, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(-11, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(-21, "день", "дня", "дней")).toBe("день");
  });

  it("должен работать с разными словами", () => {
    expect(pluralize(1, "просмотр", "просмотра", "просмотров")).toBe(
      "просмотр",
    );
    expect(pluralize(2, "просмотр", "просмотра", "просмотров")).toBe(
      "просмотра",
    );
    expect(pluralize(5, "просмотр", "просмотра", "просмотров")).toBe(
      "просмотров",
    );
    expect(pluralize(11, "просмотр", "просмотра", "просмотров")).toBe(
      "просмотров",
    );
  });
});
