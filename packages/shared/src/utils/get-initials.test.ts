import { describe, expect, it } from "bun:test";
import { getInitials } from "./get-initials";

describe("getInitials", () => {
  it("должен возвращать инициалы для полного имени", () => {
    expect(getInitials("Иван Петров")).toBe("ИП");
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("должен возвращать первые 2 символа для одного слова", () => {
    expect(getInitials("Иван")).toBe("ИВ");
    expect(getInitials("John")).toBe("JO");
  });

  it("должен обрабатывать имена с несколькими пробелами", () => {
    expect(getInitials("Иван   Петров")).toBe("ИП");
    expect(getInitials("  John  Doe  ")).toBe("JD");
  });

  it("должен обрабатывать имена с тремя и более словами", () => {
    expect(getInitials("Иван Петрович Сидоров")).toBe("ИП");
    expect(getInitials("John Michael Doe")).toBe("JM");
  });

  it("должен возвращать пустую строку для пустого имени", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });

  it("должен возвращать инициалы в верхнем регистре", () => {
    expect(getInitials("иван петров")).toBe("ИП");
    expect(getInitials("john doe")).toBe("JD");
  });

  it("должен обрабатывать короткие имена", () => {
    expect(getInitials("А")).toBe("А");
    expect(getInitials("Аб")).toBe("АБ");
  });
});
