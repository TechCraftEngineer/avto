/**
 * Тесты для извлечения данных через DataExtractor и редактирования данных
 *
 * Проверяет функциональность извлечения данных,
 * включая обработку ошибок и частичное извлечение данных (Требование 11.3)
 * Проверяет функциональность редактирования данных (Требование 8.5)
 */

import { beforeEach, describe, expect, it, } from "bun:test";
import { DataExtractor } from "../core/data-extractor";
import type { CandidateData } from "../shared/types";
import { ContentScript } from "./content-script";

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

describe("Data Editing (Task 21.6)", () => {
  let contentScript: ContentScript;
  let mockData: CandidateData;

  beforeEach(() => {
    // Очищаем DOM перед каждым тестом
    document.body.innerHTML = "";

    // Создаем экземпляр ContentScript
    contentScript = new ContentScript();

    // Создаем тестовые данные
    mockData = {
      platform: "LinkedIn",
      profileUrl: "https://www.linkedin.com/in/john-doe/",
      basicInfo: {
        fullName: "Иван Иванов",
        currentPosition: "Senior Developer",
        location: "Москва, Россия",
        photoUrl: "https://example.com/photo.jpg",
      },
      experience: [
        {
          position: "Senior Developer",
          company: "Tech Company",
          startDate: "янв. 2020",
          endDate: null,
          description: "Разработка веб-приложений",
        },
        {
          position: "Junior Developer",
          company: "Startup Inc",
          startDate: "янв. 2018",
          endDate: "дек. 2019",
          description: "Поддержка проектов",
        },
      ],
      education: [
        {
          institution: "МГУ",
          degree: "Бакалавр",
          fieldOfStudy: "Информатика",
          startDate: "2014",
          endDate: "2018",
        },
      ],
      skills: ["JavaScript", "TypeScript", "React"],
      contacts: {
        email: "ivan@example.com",
        phone: "+7 (999) 123-45-67",
        socialLinks: ["https://github.com/ivan"],
      },
      extractedAt: new Date("2024-01-01T00:00:00Z"),
    };

    // Устанавливаем currentData через приватное поле (для тестирования)
    // @ts-expect-error - accessing private field for testing
    contentScript.currentData = mockData;
  });

  describe("handleEdit - базовые поля", () => {
    it("должен обновить простое поле в basicInfo", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("basicInfo.fullName", "Петр Петров");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.basicInfo.fullName).toBe("Петр Петров");
    });

    it("должен обновить текущую должность", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("basicInfo.currentPosition", "Lead Developer");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.basicInfo.currentPosition).toBe("Lead Developer");
    });

    it("должен обновить местоположение", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("basicInfo.location", "Санкт-Петербург, Россия");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.basicInfo.location).toBe("Санкт-Петербург, Россия");
    });

    it("должен обновить URL фотографии", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit(
        "basicInfo.photoUrl",
        "https://new-photo.com/photo.jpg",
      );

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.basicInfo.photoUrl).toBe(
        "https://new-photo.com/photo.jpg",
      );
    });
  });

  describe("handleEdit - вложенные массивы", () => {
    it("должен обновить должность в первой записи опыта работы", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("experience.0.position", "Tech Lead");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.experience[0].position).toBe("Tech Lead");
      // Проверяем, что другие записи не изменились
      expect(updatedData?.experience[1].position).toBe("Junior Developer");
    });

    it("должен обновить название компании во второй записи опыта", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("experience.1.company", "New Startup LLC");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.experience[1].company).toBe("New Startup LLC");
      // Проверяем, что первая запись не изменилась
      expect(updatedData?.experience[0].company).toBe("Tech Company");
    });

    it("должен обновить описание в записи опыта", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit(
        "experience.0.description",
        "Новое описание обязанностей",
      );

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.experience[0].description).toBe(
        "Новое описание обязанностей",
      );
    });

    it("должен обновить дату начала работы", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("experience.0.startDate", "фев. 2020");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.experience[0].startDate).toBe("фев. 2020");
    });

    it("должен обновить дату окончания работы", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("experience.1.endDate", "янв. 2020");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.experience[1].endDate).toBe("янв. 2020");
    });
  });

  describe("handleEdit - образование", () => {
    it("должен обновить название учебного заведения", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("education.0.institution", "СПбГУ");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.education[0].institution).toBe("СПбГУ");
    });

    it("должен обновить степень", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("education.0.degree", "Магистр");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.education[0].degree).toBe("Магистр");
    });

    it("должен обновить специальность", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit(
        "education.0.fieldOfStudy",
        "Программная инженерия",
      );

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.education[0].fieldOfStudy).toBe(
        "Программная инженерия",
      );
    });
  });

  describe("handleEdit - навыки", () => {
    it("должен обновить весь массив навыков", () => {
      // Act
      const newSkills = ["Python", "Django", "PostgreSQL"];
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("skills", newSkills);

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.skills).toEqual(newSkills);
    });
  });

  describe("handleEdit - контакты", () => {
    it("должен обновить email", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("contacts.email", "new-email@example.com");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.contacts.email).toBe("new-email@example.com");
    });

    it("должен обновить телефон", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("contacts.phone", "+7 (999) 999-99-99");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.contacts.phone).toBe("+7 (999) 999-99-99");
    });

    it("должен обновить социальные ссылки", () => {
      // Act
      const newLinks = ["https://github.com/new", "https://twitter.com/new"];
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("contacts.socialLinks", newLinks);

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.contacts.socialLinks).toEqual(newLinks);
    });
  });

  describe("handleEdit - граничные случаи", () => {
    it("должен корректно обработать null значение", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("basicInfo.photoUrl", null);

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.basicInfo.photoUrl).toBeNull();
    });

    it("должен корректно обработать пустую строку", () => {
      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("basicInfo.location", "");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.basicInfo.location).toBe("");
    });

    it("не должен изменять данные если currentData равен null", () => {
      // Arrange
      // @ts-expect-error - accessing private field for testing
      contentScript.currentData = null;

      // Act
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("basicInfo.fullName", "Новое имя");

      // Assert
      // @ts-expect-error - accessing private field for testing
      expect(contentScript.currentData).toBeNull();
    });

    it("должен сохранить неизмененные поля при редактировании", () => {
      // Arrange
      const originalFullName = mockData.basicInfo.fullName;
      const originalLocation = mockData.basicInfo.location;

      // Act - изменяем только должность
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("basicInfo.currentPosition", "CTO");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.basicInfo.fullName).toBe(originalFullName);
      expect(updatedData?.basicInfo.location).toBe(originalLocation);
      expect(updatedData?.basicInfo.currentPosition).toBe("CTO");
    });
  });

  describe("handleEdit - множественные изменения", () => {
    it("должен корректно обработать несколько последовательных изменений", () => {
      // Act - делаем несколько изменений подряд
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("basicInfo.fullName", "Новое Имя");
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("basicInfo.currentPosition", "Новая Должность");
      // @ts-expect-error - accessing private method for testing
      contentScript.handleEdit("experience.0.company", "Новая Компания");

      // Assert
      // @ts-expect-error - accessing private field for testing
      const updatedData = contentScript.currentData;
      expect(updatedData?.basicInfo.fullName).toBe("Новое Имя");
      expect(updatedData?.basicInfo.currentPosition).toBe("Новая Должность");
      expect(updatedData?.experience[0].company).toBe("Новая Компания");
    });
  });
});
