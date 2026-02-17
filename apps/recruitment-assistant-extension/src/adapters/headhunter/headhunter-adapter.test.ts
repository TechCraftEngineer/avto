/**
 * Тесты для HeadHunter адаптера
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { HeadHunterAdapter } from "./headhunter-adapter";

describe("HeadHunterAdapter", () => {
  let adapter: HeadHunterAdapter;

  beforeEach(() => {
    adapter = new HeadHunterAdapter();
    document.body.innerHTML = "";
  });

  describe("isProfilePage", () => {
    it("должен вернуть true для URL профиля HeadHunter", () => {
      Object.defineProperty(window, "location", {
        value: {
          hostname: "hh.ru",
          pathname: "/resume/12345678",
        },
        writable: true,
      });

      const result = adapter.isProfilePage();

      expect(result).toBe(true);
    });

    it("должен вернуть true для URL с поддоменом", () => {
      Object.defineProperty(window, "location", {
        value: {
          hostname: "spb.hh.ru",
          pathname: "/resume/abcdef",
        },
        writable: true,
      });

      const result = adapter.isProfilePage();

      expect(result).toBe(true);
    });

    it("должен вернуть false для URL не-профиля", () => {
      Object.defineProperty(window, "location", {
        value: {
          hostname: "hh.ru",
          pathname: "/search/vacancy",
        },
        writable: true,
      });

      const result = adapter.isProfilePage();

      expect(result).toBe(false);
    });

    it("должен вернуть false для другого домена", () => {
      Object.defineProperty(window, "location", {
        value: {
          hostname: "linkedin.com",
          pathname: "/resume/12345",
        },
        writable: true,
      });

      const result = adapter.isProfilePage();

      expect(result).toBe(false);
    });
  });

  describe("extractBasicInfo", () => {
    it("должен извлечь базовую информацию из профиля", () => {
      document.body.innerHTML = `
        <div data-qa="resume-personal-name">Иван Иванов</div>
        <div data-qa="resume-block-title-position">Senior Developer</div>
        <div data-qa="resume-personal-address">Москва</div>
        <div data-qa="resume-photo">
          <img src="https://example.com/photo.jpg" />
        </div>
      `;

      const result = adapter.extractBasicInfo();

      expect(result.fullName).toBe("Иван Иванов");
      expect(result.currentPosition).toBe("Senior Developer");
      expect(result.location).toBe("Москва");
      expect(result.photoUrl).toBe("https://example.com/photo.jpg");
    });

    it("должен обработать отсутствие фотографии", () => {
      document.body.innerHTML = `
        <div data-qa="resume-personal-name">Иван Иванов</div>
        <div data-qa="resume-block-title-position">Senior Developer</div>
        <div data-qa="resume-personal-address">Москва</div>
      `;

      const result = adapter.extractBasicInfo();

      expect(result.photoUrl).toBeNull();
    });

    it("должен обработать пустые поля", () => {
      document.body.innerHTML = "";

      const result = adapter.extractBasicInfo();

      expect(result.fullName).toBe("");
      expect(result.currentPosition).toBe("");
      expect(result.location).toBe("");
      expect(result.photoUrl).toBeNull();
    });
  });

  describe("extractExperience", () => {
    it("должен извлечь опыт работы из профиля", () => {
      document.body.innerHTML = `
        <div data-qa="resume-block-experience-item">
          <div data-qa="resume-block-experience-position">Senior Developer</div>
          <div data-qa="resume-block-experience-company">Tech Corp</div>
          <div data-qa="resume-block-experience-date">Январь 2020 — Декабрь 2022</div>
          <div data-qa="resume-block-experience-description">Разработка веб-приложений</div>
        </div>
        <div data-qa="resume-block-experience-item">
          <div data-qa="resume-block-experience-position">Junior Developer</div>
          <div data-qa="resume-block-experience-company">StartUp Inc</div>
          <div data-qa="resume-block-experience-date">Июнь 2018 — Декабрь 2019</div>
          <div data-qa="resume-block-experience-description">Поддержка проектов</div>
        </div>
      `;

      const result = adapter.extractExperience();

      expect(result.length).toBe(2);
      expect(result[0]?.position).toBe("Senior Developer");
      expect(result[0]?.company).toBe("Tech Corp");
      expect(result[0]?.startDate).toBe("Январь 2020");
      expect(result[0]?.endDate).toBe("Декабрь 2022");
      expect(result[0]?.description).toBe("Разработка веб-приложений");
    });

    it("должен обработать текущую позицию", () => {
      document.body.innerHTML = `
        <div data-qa="resume-block-experience-item">
          <div data-qa="resume-block-experience-position">Lead Developer</div>
          <div data-qa="resume-block-experience-company">Big Tech</div>
          <div data-qa="resume-block-experience-date">Январь 2023 — по настоящее время</div>
          <div data-qa="resume-block-experience-description">Руководство командой</div>
        </div>
      `;

      const result = adapter.extractExperience();

      expect(result.length).toBe(1);
      expect(result[0]?.endDate).toBeNull();
    });

    it("должен вернуть пустой массив при отсутствии опыта", () => {
      document.body.innerHTML = "";

      const result = adapter.extractExperience();

      expect(result).toEqual([]);
    });
  });

  describe("extractEducation", () => {
    it("должен извлечь образование из профиля", () => {
      document.body.innerHTML = `
        <div data-qa="resume-block-education-item">
          <div data-qa="resume-block-education-name">МГУ</div>
          <div data-qa="resume-block-education-organization">Бакалавр</div>
          <div data-qa="resume-block-education-description">Информатика</div>
          <div data-qa="resume-block-education-year">2018</div>
        </div>
        <div data-qa="resume-block-education-item">
          <div data-qa="resume-block-education-name">МФТИ</div>
          <div data-qa="resume-block-education-organization">Магистр</div>
          <div data-qa="resume-block-education-description">Программная инженерия</div>
          <div data-qa="resume-block-education-year">2020</div>
        </div>
      `;

      const result = adapter.extractEducation();

      expect(result.length).toBe(2);
      expect(result[0]?.institution).toBe("МГУ");
      expect(result[0]?.degree).toBe("Бакалавр");
      expect(result[0]?.fieldOfStudy).toBe("Информатика");
      expect(result[0]?.startDate).toBe("");
      expect(result[0]?.endDate).toBe("2018");
    });

    it("должен вернуть пустой массив при отсутствии образования", () => {
      document.body.innerHTML = "";

      const result = adapter.extractEducation();

      expect(result).toEqual([]);
    });
  });

  describe("extractSkills", () => {
    it("должен извлечь навыки из профиля", () => {
      document.body.innerHTML = `
        <div data-qa="skills-table">
          <span data-qa="bloko-tag__text">JavaScript</span>
          <span data-qa="bloko-tag__text">TypeScript</span>
          <span data-qa="bloko-tag__text">React</span>
          <span data-qa="bloko-tag__text">Node.js</span>
        </div>
      `;

      const result = adapter.extractSkills();

      expect(result.length).toBe(4);
      expect(result).toContain("JavaScript");
      expect(result).toContain("TypeScript");
      expect(result).toContain("React");
      expect(result).toContain("Node.js");
    });

    it("должен вернуть пустой массив при отсутствии навыков", () => {
      document.body.innerHTML = "";

      const result = adapter.extractSkills();

      expect(result).toEqual([]);
    });

    it("должен вернуть пустой массив при пустом контейнере навыков", () => {
      document.body.innerHTML = `<div data-qa="skills-table"></div>`;

      const result = adapter.extractSkills();

      expect(result).toEqual([]);
    });
  });

  describe("extractContacts", () => {
    it("должен извлечь контактную информацию из профиля", () => {
      document.body.innerHTML = `
        <div data-qa="resume-contact-email">ivan@example.com</div>
        <div data-qa="resume-contact-phone">+7 (999) 123-45-67</div>
        <div data-qa="resume-contact-site">
          <a href="https://github.com/ivan">GitHub</a>
          <a href="https://t.me/ivan">Telegram</a>
        </div>
      `;

      const result = adapter.extractContacts();

      expect(result.email).toBe("ivan@example.com");
      expect(result.phone).toBe("+7 (999) 123-45-67");
      expect(result.socialLinks.length).toBe(2);
      expect(result.socialLinks).toContain("https://github.com/ivan");
      expect(result.socialLinks).toContain("https://t.me/ivan");
    });

    it("должен обработать отсутствие контактов", () => {
      document.body.innerHTML = "";

      const result = adapter.extractContacts();

      expect(result.email).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.socialLinks).toEqual([]);
    });

    it("должен обработать частичное отсутствие контактов", () => {
      document.body.innerHTML = `
        <div data-qa="resume-contact-email">ivan@example.com</div>
      `;

      const result = adapter.extractContacts();

      expect(result.email).toBe("ivan@example.com");
      expect(result.phone).toBeNull();
      expect(result.socialLinks).toEqual([]);
    });
  });

  describe("extractAll", () => {
    it("должен извлечь все данные профиля", () => {
      Object.defineProperty(window, "location", {
        value: {
          href: "https://hh.ru/resume/12345678",
        },
        writable: true,
      });

      document.body.innerHTML = `
        <div data-qa="resume-personal-name">Иван Иванов</div>
        <div data-qa="resume-block-title-position">Senior Developer</div>
        <div data-qa="resume-personal-address">Москва</div>
        <div data-qa="resume-photo">
          <img src="https://example.com/photo.jpg" />
        </div>
        <div data-qa="resume-block-experience-item">
          <div data-qa="resume-block-experience-position">Senior Developer</div>
          <div data-qa="resume-block-experience-company">Tech Corp</div>
          <div data-qa="resume-block-experience-date">Январь 2020 — по настоящее время</div>
          <div data-qa="resume-block-experience-description">Разработка</div>
        </div>
        <div data-qa="resume-block-education-item">
          <div data-qa="resume-block-education-name">МГУ</div>
          <div data-qa="resume-block-education-organization">Бакалавр</div>
          <div data-qa="resume-block-education-description">Информатика</div>
          <div data-qa="resume-block-education-year">2018</div>
        </div>
        <div data-qa="skills-table">
          <span data-qa="bloko-tag__text">JavaScript</span>
          <span data-qa="bloko-tag__text">TypeScript</span>
        </div>
        <div data-qa="resume-contact-email">ivan@example.com</div>
        <div data-qa="resume-contact-phone">+7 (999) 123-45-67</div>
      `;

      const result = adapter.extractAll();

      expect(result.platform).toBe("HeadHunter");
      expect(result.profileUrl).toBe("https://hh.ru/resume/12345678");
      expect(result.basicInfo?.fullName).toBe("Иван Иванов");
      expect(result.experience?.length).toBe(1);
      expect(result.education?.length).toBe(1);
      expect(result.skills?.length).toBe(2);
      expect(result.contacts?.email).toBe("ivan@example.com");
      expect(result.extractedAt).toBeInstanceOf(Date);
    });
  });
});
