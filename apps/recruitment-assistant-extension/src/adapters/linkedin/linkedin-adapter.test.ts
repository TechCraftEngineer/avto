/**
 * Тесты для LinkedIn адаптера
 */

import { Window } from "happy-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { LinkedInAdapter } from "./linkedin-adapter";

const happyWindow = new Window();

describe("LinkedInAdapter", () => {
  let adapter: LinkedInAdapter;

  beforeEach(() => {
    (global as any).document = happyWindow.document;
    (global as any).window = happyWindow;
    adapter = new LinkedInAdapter();
    document.body.innerHTML = "";
  });

  describe("platformName", () => {
    it("должен иметь правильное название платформы", () => {
      expect(adapter.platformName).toBe("LinkedIn");
    });
  });

  describe("isProfilePage", () => {
    it("должен вернуть true для URL профиля LinkedIn", () => {
      // Arrange
      Object.defineProperty(window, "location", {
        value: { pathname: "/in/john-doe/" },
        writable: true,
      });

      // Act
      const result = adapter.isProfilePage();

      // Assert
      expect(result).toBe(true);
    });

    it("должен вернуть true для URL профиля с дополнительными параметрами", () => {
      Object.defineProperty(window, "location", {
        value: { pathname: "/in/john-doe/details/experience/" },
        writable: true,
      });

      const result = adapter.isProfilePage();

      expect(result).toBe(true);
    });

    it("должен вернуть false для URL ленты", () => {
      Object.defineProperty(window, "location", {
        value: { pathname: "/feed/" },
        writable: true,
      });

      const result = adapter.isProfilePage();

      expect(result).toBe(false);
    });

    it("должен вернуть false для URL поиска", () => {
      Object.defineProperty(window, "location", {
        value: { pathname: "/search/results/people/" },
        writable: true,
      });

      const result = adapter.isProfilePage();

      expect(result).toBe(false);
    });

    it("должен вернуть false для пустого pathname", () => {
      Object.defineProperty(window, "location", {
        value: { pathname: "/" },
        writable: true,
      });

      const result = adapter.isProfilePage();

      expect(result).toBe(false);
    });
  });

  describe("extractBasicInfo", () => {
    it("должен извлечь полную базовую информацию", () => {
      // Arrange
      document.body.innerHTML = `
        <h1 class="text-heading-xlarge">Иван Иванов</h1>
        <div class="text-body-medium">Senior Developer</div>
        <span class="text-body-small inline">Москва, Россия</span>
        <img class="pv-top-card-profile-picture__image" src="https://example.com/photo.jpg" />
      `;

      // Act
      const result = adapter.extractBasicInfo();

      // Assert
      expect(result.fullName).toBe("Иван Иванов");
      expect(result.currentPosition).toBe("Senior Developer");
      expect(result.location).toBe("Москва, Россия");
      expect(result.photoUrl).toBe("https://example.com/photo.jpg");
    });

    it("должен обработать отсутствие фотографии", () => {
      document.body.innerHTML = `
        <h1 class="text-heading-xlarge">Иван Иванов</h1>
        <div class="text-body-medium">Senior Developer</div>
        <span class="text-body-small inline">Москва, Россия</span>
      `;

      const result = adapter.extractBasicInfo();

      expect(result.photoUrl).toBeNull();
    });

    it("должен обработать отсутствие всех полей", () => {
      document.body.innerHTML = "";

      const result = adapter.extractBasicInfo();

      expect(result.fullName).toBe("");
      expect(result.currentPosition).toBe("");
      expect(result.location).toBe("");
      expect(result.photoUrl).toBeNull();
    });

    it("должен обрезать пробелы в полях", () => {
      document.body.innerHTML = `
        <h1 class="text-heading-xlarge">  Иван Иванов  </h1>
        <div class="text-body-medium">  Senior Developer  </div>
        <span class="text-body-small inline">  Москва, Россия  </span>
      `;

      const result = adapter.extractBasicInfo();

      expect(result.fullName).toBe("Иван Иванов");
      expect(result.currentPosition).toBe("Senior Developer");
      expect(result.location).toBe("Москва, Россия");
    });
  });

  describe("extractExperience", () => {
    it("должен извлечь записи об опыте работы", () => {
      // Arrange
      document.body.innerHTML = `
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
                <span aria-hidden="true">Янв 2020 – по настоящее время</span>
              </span>
              <div class="display-flex full-width">
                <span aria-hidden="true">Разработка веб-приложений</span>
              </div>
            </li>
          </ul>
        </section>
      `;

      // Act
      const result = adapter.extractExperience();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].position).toBe("Senior Developer");
      expect(result[0].company).toBe("Tech Company");
      expect(result[0].startDate).toBe("Янв 2020");
      expect(result[0].endDate).toBeNull();
      expect(result[0].description).toBe("Разработка веб-приложений");
    });

    it("должен обработать несколько записей об опыте", () => {
      document.body.innerHTML = `
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
                <span aria-hidden="true">Янв 2020 – по настоящее время</span>
              </span>
              <div class="display-flex full-width">
                <span aria-hidden="true">Описание 1</span>
              </div>
            </li>
            <li class="artdeco-list__item">
              <div class="display-flex">
                <span aria-hidden="true">Junior Developer</span>
              </div>
              <span class="t-14 t-normal">
                <span aria-hidden="true">Old Company</span>
              </span>
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true">Янв 2018 – Дек 2019</span>
              </span>
              <div class="display-flex full-width">
                <span aria-hidden="true">Описание 2</span>
              </div>
            </li>
          </ul>
        </section>
      `;

      const result = adapter.extractExperience();

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe("Senior Developer");
      expect(result[1].position).toBe("Junior Developer");
      expect(result[1].endDate).toBe("Дек 2019");
    });

    it("должен вернуть пустой массив если секция отсутствует", () => {
      document.body.innerHTML = "";

      const result = adapter.extractExperience();

      expect(result).toEqual([]);
    });

    it("должен обработать отсутствие описания", () => {
      document.body.innerHTML = `
        <section id="experience">
          <ul>
            <li class="artdeco-list__item">
              <div class="display-flex">
                <span aria-hidden="true">Developer</span>
              </div>
              <span class="t-14 t-normal">
                <span aria-hidden="true">Company</span>
              </span>
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true">2020 – 2021</span>
              </span>
            </li>
          </ul>
        </section>
      `;

      const result = adapter.extractExperience();

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe("");
    });
  });

  describe("extractEducation", () => {
    it("должен извлечь записи об образовании", () => {
      // Arrange
      document.body.innerHTML = `
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
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true">2015 – 2019</span>
              </span>
            </li>
          </ul>
        </section>
      `;

      // Act
      const result = adapter.extractEducation();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].institution).toBe("МГУ");
      expect(result[0].degree).toBe("Бакалавр");
      expect(result[0].fieldOfStudy).toBe("Информатика");
      expect(result[0].startDate).toBe("2015");
      expect(result[0].endDate).toBe("2019");
    });

    it("должен обработать несколько записей об образовании", () => {
      document.body.innerHTML = `
        <section id="education">
          <ul>
            <li class="artdeco-list__item">
              <div class="display-flex">
                <span aria-hidden="true">МГУ</span>
              </div>
              <span class="t-14 t-normal">
                <span aria-hidden="true">Магистр</span>
              </span>
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true">Информатика</span>
              </span>
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true">2019 – 2021</span>
              </span>
            </li>
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
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true">2015 – 2019</span>
              </span>
            </li>
          </ul>
        </section>
      `;

      const result = adapter.extractEducation();

      expect(result).toHaveLength(2);
      expect(result[0].degree).toBe("Магистр");
      expect(result[1].degree).toBe("Бакалавр");
    });

    it("должен вернуть пустой массив если секция отсутствует", () => {
      document.body.innerHTML = "";

      const result = adapter.extractEducation();

      expect(result).toEqual([]);
    });

    it("должен обработать отсутствие дат", () => {
      document.body.innerHTML = `
        <section id="education">
          <ul>
            <li class="artdeco-list__item">
              <div class="display-flex">
                <span aria-hidden="true">Университет</span>
              </div>
              <span class="t-14 t-normal">
                <span aria-hidden="true">Степень</span>
              </span>
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true">Специальность</span>
              </span>
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true"></span>
              </span>
            </li>
          </ul>
        </section>
      `;

      const result = adapter.extractEducation();

      expect(result).toHaveLength(1);
      expect(result[0].institution).toBe("Университет");
      expect(result[0].degree).toBe("Степень");
      expect(result[0].fieldOfStudy).toBe("Специальность");
      expect(result[0].startDate).toBe("");
      expect(result[0].endDate).toBe("");
    });
  });

  describe("extractSkills", () => {
    it("должен извлечь навыки", () => {
      // Arrange
      document.body.innerHTML = `
        <section id="skills">
          <span aria-hidden="true">TypeScript</span>
          <span aria-hidden="true">React</span>
          <span aria-hidden="true">Node.js</span>
        </section>
      `;

      // Act
      const result = adapter.extractSkills();

      // Assert
      expect(result).toHaveLength(3);
      expect(result).toContain("TypeScript");
      expect(result).toContain("React");
      expect(result).toContain("Node.js");
    });

    it("должен вернуть пустой массив если секция отсутствует", () => {
      document.body.innerHTML = "";

      const result = adapter.extractSkills();

      expect(result).toEqual([]);
    });

    it("должен игнорировать пустые навыки", () => {
      document.body.innerHTML = `
        <section id="skills">
          <span aria-hidden="true">TypeScript</span>
          <span aria-hidden="true">   </span>
          <span aria-hidden="true">React</span>
        </section>
      `;

      const result = adapter.extractSkills();

      expect(result).toHaveLength(2);
      expect(result).toContain("TypeScript");
      expect(result).toContain("React");
    });

    it("должен обрезать пробелы в навыках", () => {
      document.body.innerHTML = `
        <section id="skills">
          <span aria-hidden="true">  TypeScript  </span>
          <span aria-hidden="true">  React  </span>
        </section>
      `;

      const result = adapter.extractSkills();

      expect(result).toEqual(["TypeScript", "React"]);
    });
  });

  describe("extractContacts", () => {
    it("должен извлечь полную контактную информацию", () => {
      // Arrange
      document.body.innerHTML = `
        <section class="pv-contact-info">
          <a href="mailto:ivan@example.com">Email</a>
          <span class="t-14 t-black t-normal">+7 (999) 123-45-67</span>
          <a href="https://github.com/ivan">GitHub</a>
          <a href="https://linkedin.com/in/ivan">LinkedIn</a>
        </section>
      `;

      // Act
      const result = adapter.extractContacts();

      // Assert
      expect(result.email).toBe("ivan@example.com");
      expect(result.phone).toBe("+7 (999) 123-45-67");
      expect(result.socialLinks).toHaveLength(1);
      expect(result.socialLinks).toContain("https://github.com/ivan");
      expect(result.socialLinks).not.toContain("https://linkedin.com/in/ivan");
    });

    it("должен обработать отсутствие контактной информации", () => {
      document.body.innerHTML = "";

      const result = adapter.extractContacts();

      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.socialLinks).toEqual([]);
    });

    it("должен обработать отсутствие email", () => {
      document.body.innerHTML = `
        <section class="pv-contact-info">
          <span class="t-14 t-black t-normal">+7 (999) 123-45-67</span>
        </section>
      `;

      const result = adapter.extractContacts();

      expect(result.email).toBeNull();
      expect(result.phone).toBe("+7 (999) 123-45-67");
    });

    it("должен обработать отсутствие телефона", () => {
      document.body.innerHTML = `
        <section class="pv-contact-info">
          <a href="mailto:ivan@example.com">Email</a>
        </section>
      `;

      const result = adapter.extractContacts();

      expect(result.email).toBe("ivan@example.com");
      expect(result.phone).toBeNull();
    });

    it("должен фильтровать ссылки на LinkedIn", () => {
      document.body.innerHTML = `
        <section class="pv-contact-info">
          <a href="https://github.com/ivan">GitHub</a>
          <a href="https://linkedin.com/in/ivan">LinkedIn</a>
          <a href="https://www.linkedin.com/in/ivan">LinkedIn 2</a>
          <a href="https://twitter.com/ivan">Twitter</a>
        </section>
      `;

      const result = adapter.extractContacts();

      expect(result.socialLinks).toHaveLength(2);
      expect(result.socialLinks).toContain("https://github.com/ivan");
      expect(result.socialLinks).toContain("https://twitter.com/ivan");
    });
  });

  describe("extractAll", () => {
    it("должен извлечь все данные профиля", () => {
      // Arrange
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
                <span aria-hidden="true">2020 – по настоящее время</span>
              </span>
              <div class="display-flex full-width">
                <span aria-hidden="true">Разработка</span>
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
              <span class="t-14 t-normal t-black--light">
                <span aria-hidden="true">2015 – 2019</span>
              </span>
            </li>
          </ul>
        </section>
        
        <section id="skills">
          <span aria-hidden="true">TypeScript</span>
          <span aria-hidden="true">React</span>
        </section>
        
        <section class="pv-contact-info">
          <a href="mailto:ivan@example.com">Email</a>
          <span class="t-14 t-black t-normal">+7 (999) 123-45-67</span>
        </section>
      `;

      // Act
      const result = adapter.extractAll();

      // Assert
      expect(result.platform).toBe("LinkedIn");
      expect(result.basicInfo.fullName).toBe("Иван Иванов");
      expect(result.experience).toHaveLength(1);
      expect(result.education).toHaveLength(1);
      expect(result.skills).toHaveLength(2);
      expect(result.contacts.email).toBe("ivan@example.com");
      expect(result.extractedAt).toBeInstanceOf(Date);
    });
  });
});
