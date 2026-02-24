/**
 * Unit-тесты для DataExtractor
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import { Window } from "happy-dom";
import { HeadHunterAdapter } from "../adapters/headhunter/headhunter-adapter";
import { LinkedInAdapter } from "../adapters/linkedin/linkedin-adapter";
import { DataExtractor } from "./data-extractor";

const happyWindow = new Window();

describe("DataExtractor", () => {
  let extractor: DataExtractor;

  beforeEach(() => {
    (global as any).document = happyWindow.document;
    (global as any).window = happyWindow;
    (happyWindow as any).SyntaxError ??= (global as any).SyntaxError;
    document.body.innerHTML = "";
    extractor = new DataExtractor();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("detectPlatform", () => {
    it("должен вернуть LinkedIn адаптер для страницы профиля LinkedIn", () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/in/john-doe/",
          hostname: "www.linkedin.com",
          href: "https://www.linkedin.com/in/john-doe/",
        },
        writable: true,
      });

      // Act
      const adapter = extractor.detectPlatform();

      // Assert
      expect(adapter).not.toBeNull();
      expect(adapter?.platformName).toBe("LinkedIn");
      expect(adapter).toBeInstanceOf(LinkedInAdapter);
    });

    it("должен вернуть HeadHunter адаптер для страницы резюме HeadHunter", () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/resume/12345678",
          hostname: "hh.ru",
          href: "https://hh.ru/resume/12345678",
        },
        writable: true,
      });

      // Act
      const adapter = extractor.detectPlatform();

      // Assert
      expect(adapter).not.toBeNull();
      expect(adapter?.platformName).toBe("HeadHunter");
      expect(adapter).toBeInstanceOf(HeadHunterAdapter);
    });

    it("должен вернуть null для неподдерживаемой платформы", () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/profile/user",
          hostname: "example.com",
          href: "https://example.com/profile/user",
        },
        writable: true,
      });

      // Act
      const adapter = extractor.detectPlatform();

      // Assert
      expect(adapter).toBeNull();
    });

    it("должен вернуть null для страницы, не являющейся профилем", () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/feed/",
          hostname: "www.linkedin.com",
          href: "https://www.linkedin.com/feed/",
        },
        writable: true,
      });

      // Act
      const adapter = extractor.detectPlatform();

      // Assert
      expect(adapter).toBeNull();
    });
  });

  describe("extract", () => {
    it("должен успешно извлечь данные с LinkedIn профиля", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/in/john-doe/",
          hostname: "www.linkedin.com",
          href: "https://www.linkedin.com/in/john-doe/",
        },
        writable: true,
      });

      document.body.innerHTML = `
        <h1 class="text-heading-xlarge">Иван Иванов</h1>
        <div class="text-body-medium">Senior Developer</div>
        <span class="text-body-small inline">Москва, Россия</span>
        <img class="pv-top-card-profile-picture__image" src="https://example.com/photo.jpg" />
      `;

      // Act
      const data = await extractor.extract();

      // Assert
      expect(data).toBeDefined();
      expect(data.platform).toBe("LinkedIn");
      expect(data.profileUrl).toBe("https://www.linkedin.com/in/john-doe/");
      expect(data.basicInfo.fullName).toBe("Иван Иванов");
      expect(data.basicInfo.currentPosition).toBe("Senior Developer");
      expect(data.basicInfo.location).toBe("Москва, Россия");
      expect(data.extractedAt).toBeInstanceOf(Date);
    });

    it("должен успешно извлечь данные с HeadHunter профиля", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/resume/12345678",
          hostname: "hh.ru",
          href: "https://hh.ru/resume/12345678",
        },
        writable: true,
      });

      document.body.innerHTML = `
        <div data-qa="resume-personal-name">Петр Петров</div>
        <div data-qa="resume-block-title-position">Backend Developer</div>
        <div data-qa="resume-personal-address">Санкт-Петербург</div>
      `;

      // Act
      const data = await extractor.extract();

      // Assert
      expect(data).toBeDefined();
      expect(data.platform).toBe("HeadHunter");
      expect(data.profileUrl).toBe("https://hh.ru/resume/12345678");
      expect(data.basicInfo.fullName).toBe("Петр Петров");
      expect(data.basicInfo.currentPosition).toBe("Backend Developer");
      expect(data.basicInfo.location).toBe("Санкт-Петербург");
    });

    it("должен выбросить ошибку для неподдерживаемой платформы", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/profile/user",
          hostname: "example.com",
          href: "https://example.com/profile/user",
        },
        writable: true,
      });

      // Act & Assert
      await expect(extractor.extract()).rejects.toThrow(
        "Неподдерживаемая платформа или страница не является профилем кандидата",
      );
    });

    it("должен выбросить ошибку при неудачном извлечении данных", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/in/john-doe/",
          hostname: "www.linkedin.com",
          href: "https://www.linkedin.com/in/john-doe/",
        },
        writable: true,
      });

      // Мокаем метод extractAll, чтобы он выбросил ошибку
      const adapter = extractor.detectPlatform();
      if (adapter) {
        vi.spyOn(adapter, "extractAll").mockImplementation(() => {
          throw new Error("DOM parsing error");
        });
      }

      // Act & Assert
      await expect(extractor.extract()).rejects.toThrow(
        "Не удалось извлечь данные профиля",
      );
    });

    it("должен вернуть данные с корректной структурой", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/in/john-doe/",
          hostname: "www.linkedin.com",
          href: "https://www.linkedin.com/in/john-doe/",
        },
        writable: true,
      });

      document.body.innerHTML = `
        <h1 class="text-heading-xlarge">Тест Тестов</h1>
        <div class="text-body-medium">QA Engineer</div>
        <span class="text-body-small inline">Новосибирск</span>
      `;

      // Act
      const data = await extractor.extract();

      // Assert
      expect(data).toHaveProperty("platform");
      expect(data).toHaveProperty("profileUrl");
      expect(data).toHaveProperty("basicInfo");
      expect(data).toHaveProperty("experience");
      expect(data).toHaveProperty("education");
      expect(data).toHaveProperty("skills");
      expect(data).toHaveProperty("contacts");
      expect(data).toHaveProperty("extractedAt");

      expect(Array.isArray(data.experience)).toBe(true);
      expect(Array.isArray(data.education)).toBe(true);
      expect(Array.isArray(data.skills)).toBe(true);
      expect(Array.isArray(data.contacts.socialLinks)).toBe(true);
    });

    it("должен обрабатывать пустые разделы профиля", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/in/john-doe/",
          hostname: "www.linkedin.com",
          href: "https://www.linkedin.com/in/john-doe/",
        },
        writable: true,
      });

      document.body.innerHTML = `
        <h1 class="text-heading-xlarge">Минимальный Профиль</h1>
        <div class="text-body-medium">Junior Developer</div>
        <span class="text-body-small inline">Москва</span>
      `;

      // Act
      const data = await extractor.extract();

      // Assert
      expect(data.experience).toEqual([]);
      expect(data.education).toEqual([]);
      expect(data.skills).toEqual([]);
      expect(data.contacts.email).toBeNull();
      expect(data.contacts.phone).toBeNull();
      expect(data.contacts.socialLinks).toEqual([]);
    });
  });

  describe("constructor", () => {
    it("должен инициализировать адаптеры для всех поддерживаемых платформ", () => {
      // Act
      const extractor = new DataExtractor();

      // Assert
      expect(extractor).toBeDefined();
      // Проверяем, что адаптеры работают
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/in/test/",
          hostname: "www.linkedin.com",
          href: "https://www.linkedin.com/in/test/",
        },
        writable: true,
      });
      expect(extractor.detectPlatform()).toBeInstanceOf(LinkedInAdapter);

      Object.defineProperty(window, "location", {
        value: {
          pathname: "/resume/123",
          hostname: "hh.ru",
          href: "https://hh.ru/resume/123",
        },
        writable: true,
      });
      expect(extractor.detectPlatform()).toBeInstanceOf(HeadHunterAdapter);
    });
  });
});
