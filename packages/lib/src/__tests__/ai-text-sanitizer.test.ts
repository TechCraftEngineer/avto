import { describe, expect, test } from "bun:test";
import { sanitizeAiText, sanitizeAiTextArray } from "../ai-text-sanitizer";

describe("sanitizeAiText", () => {
  test("удаляет нулевые байты", () => {
    const input = "Hello\x00World";
    const result = sanitizeAiText(input);
    expect(result).toBe("HelloWorld");
  });

  test("удаляет управляющие символы", () => {
    const input = "Hello\x00World\x1F";
    const result = sanitizeAiText(input);
    expect(result).toBe("HelloWorld");
  });

  test("удаляет HTML теги", () => {
    const input = "Hello <script>alert('xss')</script> World";
    const result = sanitizeAiText(input);
    expect(result).toBe("Hello alert'xss' World");
  });

  test("удаляет JavaScript протоколы", () => {
    const input = "Click javascript:alert('xss') here";
    const result = sanitizeAiText(input);
    expect(result).toBe("Click alert'xss' here");
  });

  test("удаляет опасные символы", () => {
    const input = "Test | command & injection";
    const result = sanitizeAiText(input);
    expect(result).toBe("Test command injection");
  });

  test("фильтрует запрещенные слова", () => {
    const input = "This is a hack attempt";
    const result = sanitizeAiText(input);
    expect(result).toContain("****");
  });

  test("нормализует множественные пробелы", () => {
    const input = "Hello    World";
    const result = sanitizeAiText(input);
    expect(result).toBe("Hello World");
  });

  test("нормализует множественные переносы строк", () => {
    const input = "Line1\n\n\n\nLine2";
    const result = sanitizeAiText(input);
    expect(result).toBe("Line1\n\nLine2");
  });

  test("ограничивает длину текста", () => {
    const input = "a".repeat(6000);
    const result = sanitizeAiText(input, 100);
    expect(result.length).toBeLessThanOrEqual(103); // 100 + "..."
  });

  test("возвращает пустую строку для null/undefined", () => {
    expect(sanitizeAiText(null)).toBe("");
    expect(sanitizeAiText(undefined)).toBe("");
  });
});

describe("sanitizeAiTextArray", () => {
  test("санитизирует массив строк", () => {
    const input = ["Hello <script>", "World | test"];
    const result = sanitizeAiTextArray(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("Hello");
    expect(result[1]).toBe("World test");
  });

  test("фильтрует пустые строки", () => {
    const input = ["Hello", "", "World"];
    const result = sanitizeAiTextArray(input);
    expect(result).toHaveLength(2);
    expect(result).toEqual(["Hello", "World"]);
  });

  test("возвращает пустой массив для null/undefined", () => {
    expect(sanitizeAiTextArray(null)).toEqual([]);
    expect(sanitizeAiTextArray(undefined)).toEqual([]);
  });

  test("ограничивает длину каждого элемента", () => {
    const input = ["a".repeat(2000), "b".repeat(2000)];
    const result = sanitizeAiTextArray(input, 100);
    expect(result[0].length).toBeLessThanOrEqual(103);
    expect(result[1].length).toBeLessThanOrEqual(103);
  });
});
