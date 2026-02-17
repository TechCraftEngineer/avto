/**
 * Тесты для извлечения данных через DataExtractor
 *
 * Проверяет функциональность извлечения данных,
 * включая обработку ошибок и частичное извлечение данных (Требование 11.3)
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { DataExtractor } from "../core/data-extractor";
import type { CandidateData } from "../shared/types";

describe("Data Extraction (Task 21.4)", () => {
  beforeEach(() => {
    // Очищаем DOM перед каждым тестом
    document.body.innerHTML = "";
  });

  describe("DataExtractor.extract", () => {
    it("должен успешно извлечь данные с LinkedIn профиля", async () => {
      // Arrange: Настраиваем DOM для LinkedIn профиля
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/in/john-doe/",
          href: "https://www.linkedin.com/in/john-doe/",
        },
        writable: true,
        configurable: true,
      });

      document.body.innerHTML = `
        <h1 class="text-heading-xlarge">Иван Иванов</h1>
        <div class="text-body-medium">Senior Developer</div>
        <span class="text-body-small inline">Москва, Россия</span>
        <img class="pv-top-card-profile-picture__image" src="https://example.com/photo.jpg" />
      `;

      // Act
      const extractor = new DataExtractor();
      const result = await extractor.extract();

      // Assert
      expect(result).toBeDefined();
      expect(result.platform).toBe("LinkedIn");
      expect(result.profileUrl).toBe("https://www.linkedin.com/in/john-doe/");
      expect(result.basicInfo).toBeDefined();
      expect(result.basicInfo.fullName).toBe("Иван Иванов");
      expect(result.basicInfo.currentPosition).toBe("Senior Developer");
      expect(result.basicInfo.location).toBe("Москва, Россия");
    });

    it("должен извлечь данные с неполным профилем", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/in/john-doe/",
          href: "https://www.linkedin.com/in/john-doe/",
        },
        writable: true,
        configurable: true,
      });

      // Только базовая информация доступна
      document.body.innerHTML = `
        <h1 class="text-heading-xlarge">Иван Иванов</h1>
        <div class="text-body-medium">Senior Developer</div>
      `;

      // Act
      const extractor = new DataExtractor();
      const result = await extractor.extract();

      // Assert: Должны получить хотя бы частичные данные
      expect(result).toBeDefined();
      expect(result.basicInfo).toBeDefined();
      expect(result.basicInfo.fullName).toBe("Иван Иванов");
      expect(result.experience).toEqual([]);
      expect(result.education).toEqual([]);
      expect(result.skills).toEqual([]);
    });

    it("должен выбросить ошибку когда платформа не поддерживается", async () => {
      // Arrange: Настраиваем неподдерживаемую страницу
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/feed/",
          href: "https://www.linkedin.com/feed/",
          hostname: "www.linkedin.com",
        },
        writable: true,
        configurable: true,
      });

      // Act & Assert
      const extractor = new DataExtractor();

      try {
        await extractor.extract();
        expect(true).toBe(false); // Не должны дойти сюда
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain(
          "Неподдерживаемая платформа",
        );
      }
    });

    it("должен вернуть данные с пустыми массивами для отсутствующих секций", async () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/in/john-doe/",
          href: "https://www.linkedin.com/in/john-doe/",
        },
        writable: true,
        configurable: true,
      });

      // Профиль без опыта, образования и навыков
      document.body.innerHTML = `
        <h1 class="text-heading-xlarge">Иван Иванов</h1>
        <div class="text-body-medium">Junior Developer</div>
        <span class="text-body-small inline">Санкт-Петербург, Россия</span>
      `;

      // Act
      const extractor = new DataExtractor();
      const result = await extractor.extract();

      // Assert
      expect(result).toBeDefined();
      expect(result.experience).toEqual([]);
      expect(result.education).toEqual([]);
      expect(result.skills).toEqual([]);
      expect(result.contacts.email).toBeNull();
      expect(result.contacts.phone).toBeNull();
      expect(result.contacts.socialLinks).toEqual([]);
    });

    it("должен корректно извлечь все секции профиля", async () => {
      // Arrange: Полный профиль LinkedIn
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/in/john-doe/",
          href: "https://www.linkedin.com/in/john-doe/",
        },
        writable: true,
        configurable: true,
      });

      document.body.innerHTML = `
        <h1 class="text-heading-xlarge">Иван Иванов</h1>
        <div class="text-body-medium">Senior Developer</div>
        <span class="text-body-small inline">Москва, Россия</span>
        <img class="pv-top-card-profile-picture__image" src="https://example.com/photo.jpg" />
        
        <section id="experience">
          <ul>
            <li class="artdeco-list__item">
              <div class="display-flex">
                <span aria-hidden="true">Senior Developer</span>
              </div>
              <span class="t-14 t-normal">
                <span aria-hidden="true">Tech Company</span>
              </span>
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true">янв. 2020 – по настоящее время</span>
              </span>
              <div class="display-flex full-width">
                <span aria-hidden="true">Разработка веб-приложений</span>
              </div>
            </li>
          </ul>
        </section>
        
        <section id="education">
          <ul>
            <li class="artdeco-list__item">
              <div class="display-flex">
                <span aria-hidden="true">МГУ</span>
              </div>
              <span class="t-14 t-normal">
                <span aria-hidden="true">Бакалавр</span>
              </span>
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true">Информатика</span>
              </span>
            </li>
          </ul>
        </section>
        
        <section id="skills">
          <span aria-hidden="true">JavaScript</span>
          <span aria-hidden="true">TypeScript</span>
          <span aria-hidden="true">React</span>
        </section>
      `;

      // Act
      const extractor = new DataExtractor();
      const result: CandidateData = await extractor.extract();

      // Assert
      expect(result).toBeDefined();
      expect(result.platform).toBe("LinkedIn");
      expect(result.basicInfo.fullName).toBe("Иван Иванов");
      expect(result.basicInfo.currentPosition).toBe("Senior Developer");
      expect(result.basicInfo.location).toBe("Москва, Россия");
      expect(result.experience.length).toBeGreaterThan(0);
      expect(result.education.length).toBeGreaterThan(0);
      expect(result.skills.length).toBeGreaterThan(0);
      expect(result.extractedAt).toBeInstanceOf(Date);
    });
  });
});
