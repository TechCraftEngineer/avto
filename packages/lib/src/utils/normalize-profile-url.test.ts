import { describe, expect, it } from "bun:test";
import { normalizePlatformProfileUrl } from "./normalize-profile-url";

describe("normalizePlatformProfileUrl", () => {
  it("убирает поддомены HH и query-параметры", () => {
    const input =
      "https://spb.hh.ru/resume/7021c5d7000fa7472d004a23a134657a4a5063?vacancyId=130376180&t=5080122827&resumeId=269131898";
    expect(normalizePlatformProfileUrl(input)).toBe(
      "https://hh.ru/resume/7021c5d7000fa7472d004a23a134657a4a5063",
    );
  });

  it("нормализует moscow.hh.ru", () => {
    expect(
      normalizePlatformProfileUrl("https://moscow.hh.ru/resume/abc123?foo=bar"),
    ).toBe("https://hh.ru/resume/abc123");
  });

  it("оставляет hh.ru без изменений хостa", () => {
    expect(
      normalizePlatformProfileUrl("https://hh.ru/resume/xyz456?vacancyId=1"),
    ).toBe("https://hh.ru/resume/xyz456");
  });

  it("убирает trailing slash", () => {
    expect(normalizePlatformProfileUrl("https://hh.ru/resume/xxx/")).toBe(
      "https://hh.ru/resume/xxx",
    );
  });
});
