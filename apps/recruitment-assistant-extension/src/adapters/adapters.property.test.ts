/**
 * Property-based тесты для адаптеров платформ
 *
 * Эти тесты проверяют универсальные свойства, которые должны выполняться
 * для всех валидных входных данных на поддерживаемых платформах.
 */

import * as fc from "fast-check";
import { Window } from "happy-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HeadHunterAdapter } from "./headhunter/headhunter-adapter";
import { LinkedInAdapter } from "./linkedin/linkedin-adapter";

// Создаем глобальное окружение для тестов
const happyWindow = new Window();
declare global {
  var window: Window;
  var document: Document;
}
(global as any).window = happyWindow;
(global as any).document = happyWindow.document;

describe("Property-based тесты адаптеров", () => {
  beforeEach(() => {
    // Очищаем DOM перед каждым тестом
    if (typeof document !== "undefined") {
      document.body.innerHTML = "";
    }
  });

  afterEach(() => {
    // Очищаем DOM после каждого теста
    if (typeof document !== "undefined") {
      document.body.innerHTML = "";
    }
  });
  /**
   * Свойство 1: Определение платформы профиля
   *
   * **Валидирует: Требования 2.1, 2.2**
   *
   * Для любого URL страницы, если это страница профиля на поддерживаемой платформе
   * (LinkedIn, HeadHunter), то метод isProfilePage() соответствующего адаптера
   * должен вернуть true, а для всех остальных URL должен вернуть false.
   */
  describe("Свойство 1: Определение платформы профиля", () => {
    it("LinkedIn адаптер должен определять профильные URL", () => {
      fc.assert(
        fc.property(
          fc.record({
            pathname: fc.oneof(
              fc.constant("/in/john-doe"),
              fc.constant("/in/jane-smith/"),
              fc.constant("/in/user123/details/experience"),
            ),
          }),
          (location) => {
            // Arrange
            Object.defineProperty(window, "location", {
              value: location,
              writable: true,
            });
            const adapter = new LinkedInAdapter();

            // Act
            const result = adapter.isProfilePage();

            // Assert
            expect(result).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("LinkedIn адаптер должен отклонять не-профильные URL", () => {
      fc.assert(
        fc.property(
          fc.record({
            pathname: fc.oneof(
              fc.constant("/feed/"),
              fc.constant("/search/results/people/"),
              fc.constant("/jobs/"),
              fc.constant("/"),
            ),
          }),
          (location) => {
            // Arrange
            Object.defineProperty(window, "location", {
              value: location,
              writable: true,
            });
            const adapter = new LinkedInAdapter();

            // Act
            const result = adapter.isProfilePage();

            // Assert
            expect(result).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("HeadHunter адаптер должен определять профильные URL", () => {
      fc.assert(
        fc.property(
          fc.record({
            hostname: fc.oneof(
              fc.constant("hh.ru"),
              fc.constant("spb.hh.ru"),
              fc.constant("moscow.hh.ru"),
            ),
            pathname: fc.string({ minLength: 8 }).map((s) => `/resume/${s}`),
          }),
          (location) => {
            // Arrange
            Object.defineProperty(window, "location", {
              value: location,
              writable: true,
            });
            const adapter = new HeadHunterAdapter();

            // Act
            const result = adapter.isProfilePage();

            // Assert
            expect(result).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("HeadHunter адаптер должен отклонять не-профильные URL", () => {
      fc.assert(
        fc.property(
          fc.record({
            hostname: fc.constant("hh.ru"),
            pathname: fc.oneof(
              fc.constant("/search/vacancy"),
              fc.constant("/employer/"),
              fc.constant("/"),
            ),
          }),
          (location) => {
            // Arrange
            Object.defineProperty(window, "location", {
              value: location,
              writable: true,
            });
            const adapter = new HeadHunterAdapter();

            // Act
            const result = adapter.isProfilePage();

            // Assert
            expect(result).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Свойство 2: Извлечение базовой информации
   *
   * **Валидирует: Требования 3.1, 3.2, 3.3, 3.4**
   *
   * Для любого профиля кандидата на поддерживаемой платформе, извлечение данных
   * должно вернуть объект с заполненными полями fullName, currentPosition, location
   * и photoUrl (или null для photoUrl, если фото отсутствует).
   */
  describe("Свойство 2: Извлечение базовой информации", () => {
    it("LinkedIn: извлеченная базовая информация должна иметь все обязательные поля", () => {
      fc.assert(
        fc.property(
          fc.record({
            fullName: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter(
                (s) =>
                  s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
              ),
            position: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter(
                (s) =>
                  s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
              ),
            location: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter(
                (s) =>
                  s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
              ),
            photoUrl: fc.option(fc.webUrl(), { nil: null }),
          }),
          (data) => {
            // Arrange
            document.body.innerHTML = `
              <h1 class="text-heading-xlarge">${data.fullName}</h1>
              <div class="text-body-medium">${data.position}</div>
              <span class="text-body-small inline">${data.location}</span>
              ${data.photoUrl ? `<img class="pv-top-card-profile-picture__image" src="${data.photoUrl}" />` : ""}
            `;
            const adapter = new LinkedInAdapter();

            // Act
            const result = adapter.extractBasicInfo();

            // Assert
            expect(result).toHaveProperty("fullName");
            expect(result).toHaveProperty("currentPosition");
            expect(result).toHaveProperty("location");
            expect(result).toHaveProperty("photoUrl");
            expect(result.fullName).toBe(data.fullName.trim());
            expect(result.currentPosition).toBe(data.position.trim());
            expect(result.location).toBe(data.location.trim());
            expect(result.photoUrl).toBe(data.photoUrl);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("HeadHunter: извлеченная базовая информация должна иметь все обязательные поля", () => {
      fc.assert(
        fc.property(
          fc.record({
            fullName: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter(
                (s) =>
                  s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
              ),
            position: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter(
                (s) =>
                  s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
              ),
            location: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter(
                (s) =>
                  s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
              ),
            photoUrl: fc.option(fc.webUrl(), { nil: null }),
          }),
          (data) => {
            // Arrange
            document.body.innerHTML = `
              <div data-qa="resume-personal-name">${data.fullName}</div>
              <div data-qa="resume-block-title-position">${data.position}</div>
              <div data-qa="resume-personal-address">${data.location}</div>
              ${data.photoUrl ? `<div data-qa="resume-photo"><img src="${data.photoUrl}" /></div>` : ""}
            `;
            const adapter = new HeadHunterAdapter();

            // Act
            const result = adapter.extractBasicInfo();

            // Assert
            expect(result).toHaveProperty("fullName");
            expect(result).toHaveProperty("currentPosition");
            expect(result).toHaveProperty("location");
            expect(result).toHaveProperty("photoUrl");
            expect(result.fullName).toBe(data.fullName.trim());
            expect(result.currentPosition).toBe(data.position.trim());
            expect(result.location).toBe(data.location.trim());
            expect(result.photoUrl).toBe(data.photoUrl);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Свойство 3: Извлечение всех записей опыта работы
   *
   * **Валидирует: Требования 4.1, 4.2**
   *
   * Для любого профиля кандидата, количество извлеченных записей об опыте работы
   * должно соответствовать количеству записей, отображаемых на странице профиля,
   * и каждая запись должна содержать поля position, company, startDate, endDate и description.
   */
  describe("Свойство 3: Извлечение всех записей опыта работы", () => {
    it("LinkedIn: количество извлеченных записей должно соответствовать количеству в DOM", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              position: fc.string({ minLength: 1, maxLength: 50 }),
              company: fc.string({ minLength: 1, maxLength: 50 }),
              dateRange: fc.string({ minLength: 1, maxLength: 50 }),
              description: fc.string({ maxLength: 200 }),
            }),
            { minLength: 0, maxLength: 10 },
          ),
          (experiences) => {
            // Arrange
            const experienceItems = experiences
              .map(
                (exp) => `
              <li class="artdeco-list__item">
                <div class="display-flex">
                  <span aria-hidden="true">${exp.position}</span>
                </div>
                <span class="t-14 t-normal">
                  <span aria-hidden="true">${exp.company}</span>
                </span>
                <span class="t-14 t-normal t-black--light">
                  <span aria-hidden="true">${exp.dateRange}</span>
                </span>
                <div class="display-flex full-width">
                  <span aria-hidden="true">${exp.description}</span>
                </div>
              </li>
            `,
              )
              .join("");

            document.body.innerHTML = `
              <section id="experience">
                <ul>${experienceItems}</ul>
              </section>
            `;
            const adapter = new LinkedInAdapter();

            // Act
            const result = adapter.extractExperience();

            // Assert
            expect(result).toHaveLength(experiences.length);
            result.forEach((entry) => {
              expect(entry).toHaveProperty("position");
              expect(entry).toHaveProperty("company");
              expect(entry).toHaveProperty("startDate");
              expect(entry).toHaveProperty("endDate");
              expect(entry).toHaveProperty("description");
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("HeadHunter: количество извлеченных записей должно соответствовать количеству в DOM", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              position: fc.string({ minLength: 1, maxLength: 50 }),
              company: fc.string({ minLength: 1, maxLength: 50 }),
              dateRange: fc.string({ minLength: 1, maxLength: 50 }),
              description: fc.string({ maxLength: 200 }),
            }),
            { minLength: 0, maxLength: 10 },
          ),
          (experiences) => {
            // Arrange
            const experienceItems = experiences
              .map(
                (exp) => `
              <div data-qa="resume-block-experience-item">
                <div data-qa="resume-block-experience-position">${exp.position}</div>
                <div data-qa="resume-block-experience-company">${exp.company}</div>
                <div data-qa="resume-block-experience-date">${exp.dateRange}</div>
                <div data-qa="resume-block-experience-description">${exp.description}</div>
              </div>
            `,
              )
              .join("");

            document.body.innerHTML = experienceItems;
            const adapter = new HeadHunterAdapter();

            // Act
            const result = adapter.extractExperience();

            // Assert
            expect(result).toHaveLength(experiences.length);
            result.forEach((entry) => {
              expect(entry).toHaveProperty("position");
              expect(entry).toHaveProperty("company");
              expect(entry).toHaveProperty("startDate");
              expect(entry).toHaveProperty("endDate");
              expect(entry).toHaveProperty("description");
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Свойство 4: Извлечение всех записей образования
   *
   * **Валидирует: Требования 5.1, 5.2**
   *
   * Для любого профиля кандидата, количество извлеченных записей об образовании
   * должно соответствовать количеству записей, отображаемых на странице профиля,
   * и каждая запись должна содержать поля institution, degree, fieldOfStudy, startDate и endDate.
   */
  describe("Свойство 4: Извлечение всех записей образования", () => {
    it("LinkedIn: количество извлеченных записей должно соответствовать количеству в DOM", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              institution: fc.string({ minLength: 1, maxLength: 50 }),
              degree: fc.string({ minLength: 1, maxLength: 50 }),
              fieldOfStudy: fc.string({ minLength: 1, maxLength: 50 }),
              dateRange: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 0, maxLength: 10 },
          ),
          (educations) => {
            // Arrange
            const educationItems = educations
              .map(
                (edu) => `
              <li class="artdeco-list__item">
                <div class="display-flex">
                  <span aria-hidden="true">${edu.institution}</span>
                </div>
                <span class="t-14 t-normal">
                  <span aria-hidden="true">${edu.degree}</span>
                </span>
                <span class="t-14 t-normal t-black--light">
                  <span aria-hidden="true">${edu.fieldOfStudy}</span>
                </span>
                <span class="t-14 t-normal t-black--light">
                  <span aria-hidden="true">${edu.dateRange}</span>
                </span>
              </li>
            `,
              )
              .join("");

            document.body.innerHTML = `
              <section id="education">
                <ul>${educationItems}</ul>
              </section>
            `;
            const adapter = new LinkedInAdapter();

            // Act
            const result = adapter.extractEducation();

            // Assert
            expect(result).toHaveLength(educations.length);
            result.forEach((entry) => {
              expect(entry).toHaveProperty("institution");
              expect(entry).toHaveProperty("degree");
              expect(entry).toHaveProperty("fieldOfStudy");
              expect(entry).toHaveProperty("startDate");
              expect(entry).toHaveProperty("endDate");
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("HeadHunter: количество извлеченных записей должно соответствовать количеству в DOM", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              institution: fc.string({ minLength: 1, maxLength: 50 }),
              degree: fc.string({ minLength: 1, maxLength: 50 }),
              fieldOfStudy: fc.string({ minLength: 1, maxLength: 50 }),
              year: fc.string({ minLength: 1, maxLength: 10 }),
            }),
            { minLength: 0, maxLength: 10 },
          ),
          (educations) => {
            // Arrange
            const educationItems = educations
              .map(
                (edu) => `
              <div data-qa="resume-block-education-item">
                <div data-qa="resume-block-education-name">${edu.institution}</div>
                <div data-qa="resume-block-education-organization">${edu.degree}</div>
                <div data-qa="resume-block-education-description">${edu.fieldOfStudy}</div>
                <div data-qa="resume-block-education-year">${edu.year}</div>
              </div>
            `,
              )
              .join("");

            document.body.innerHTML = educationItems;
            const adapter = new HeadHunterAdapter();

            // Act
            const result = adapter.extractEducation();

            // Assert
            expect(result).toHaveLength(educations.length);
            result.forEach((entry) => {
              expect(entry).toHaveProperty("institution");
              expect(entry).toHaveProperty("degree");
              expect(entry).toHaveProperty("fieldOfStudy");
              expect(entry).toHaveProperty("startDate");
              expect(entry).toHaveProperty("endDate");
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Свойство 5: Сохранение хронологического порядка
   *
   * **Валидирует: Требования 4.4, 5.3, 6.2**
   *
   * Для любого профиля кандидата, порядок записей в извлеченных данных
   * (опыт работы, образование, навыки) должен соответствовать порядку
   * их отображения на странице профиля.
   */
  describe("Свойство 5: Сохранение хронологического порядка", () => {
    it("LinkedIn: порядок опыта работы должен сохраняться", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              position: fc
                .string({ minLength: 1, maxLength: 50 })
                .filter(
                  (s) =>
                    s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
                ),
              company: fc
                .string({ minLength: 1, maxLength: 50 })
                .filter(
                  (s) =>
                    s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
                ),
            }),
            { minLength: 2, maxLength: 5 },
          ),
          (experiences) => {
            // Arrange
            const experienceItems = experiences
              .map(
                (exp) => `
              <li class="artdeco-list__item">
                <div class="display-flex">
                  <span aria-hidden="true">${exp.position}</span>
                </div>
                <span class="t-14 t-normal">
                  <span aria-hidden="true">${exp.company}</span>
                </span>
                <span class="t-14 t-normal t-black--light">
                  <span aria-hidden="true">2020 – 2021</span>
                </span>
                <div class="display-flex full-width">
                  <span aria-hidden="true">Description</span>
                </div>
              </li>
            `,
              )
              .join("");

            document.body.innerHTML = `
              <section id="experience">
                <ul>${experienceItems}</ul>
              </section>
            `;
            const adapter = new LinkedInAdapter();

            // Act
            const result = adapter.extractExperience();

            // Assert
            expect(result).toHaveLength(experiences.length);
            result.forEach((entry, index) => {
              expect(entry.position).toBe(experiences[index].position.trim());
              expect(entry.company).toBe(experiences[index].company.trim());
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("LinkedIn: порядок навыков должен сохраняться", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc
              .string({ minLength: 1, maxLength: 30 })
              .filter(
                (s) =>
                  s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
              ),
            {
              minLength: 2,
              maxLength: 10,
            },
          ),
          (skills) => {
            // Arrange
            const skillItems = skills
              .map((skill) => `<span aria-hidden="true">${skill}</span>`)
              .join("");

            document.body.innerHTML = `
              <section id="skills">${skillItems}</section>
            `;
            const adapter = new LinkedInAdapter();

            // Act
            const result = adapter.extractSkills();

            // Assert
            expect(result).toHaveLength(skills.length);
            result.forEach((skill, index) => {
              expect(skill).toBe(skills[index].trim());
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Свойство 6: Извлечение навыков
   *
   * **Валидирует: Требования 6.1**
   *
   * Для любого профиля кандидата, все навыки, отображаемые в разделе навыков
   * на странице, должны быть извлечены и включены в результирующий массив skills.
   */
  describe("Свойство 6: Извлечение навыков", () => {
    it("LinkedIn: все навыки должны быть извлечены", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc
              .string({ minLength: 1, maxLength: 30 })
              .filter(
                (s) =>
                  s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
              ),
            {
              minLength: 0,
              maxLength: 20,
            },
          ),
          (skills) => {
            // Arrange
            const skillItems = skills
              .map((skill) => `<span aria-hidden="true">${skill}</span>`)
              .join("");

            document.body.innerHTML = `
              <section id="skills">${skillItems}</section>
            `;
            const adapter = new LinkedInAdapter();

            // Act
            const result = adapter.extractSkills();

            // Assert
            expect(result).toHaveLength(skills.length);
            skills.forEach((skill) => {
              expect(result).toContain(skill.trim());
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("HeadHunter: все навыки должны быть извлечены", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc
              .string({ minLength: 1, maxLength: 30 })
              .filter(
                (s) =>
                  s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
              ),
            {
              minLength: 0,
              maxLength: 20,
            },
          ),
          (skills) => {
            // Arrange
            const skillItems = skills
              .map((skill) => `<span data-qa="bloko-tag__text">${skill}</span>`)
              .join("");

            document.body.innerHTML = `
              <div data-qa="skills-table">${skillItems}</div>
            `;
            const adapter = new HeadHunterAdapter();

            // Act
            const result = adapter.extractSkills();

            // Assert
            expect(result).toHaveLength(skills.length);
            skills.forEach((skill) => {
              expect(result).toContain(skill.trim());
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Свойство 7: Извлечение контактной информации
   *
   * **Валидирует: Требования 7.1, 7.2, 7.3**
   *
   * Для любого профиля кандидата, если контактная информация (email, телефон,
   * социальные ссылки) доступна на странице, она должна быть извлечена
   * и включена в объект contacts.
   */
  describe("Свойство 7: Извлечение контактной информации", () => {
    it("LinkedIn: контактная информация должна быть извлечена если доступна", () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.option(fc.emailAddress(), { nil: null }),
            phone: fc.option(
              fc
                .string({ minLength: 5, maxLength: 20 })
                .filter(
                  (s) =>
                    s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
                ),
              {
                nil: null,
              },
            ),
            socialLinks: fc.array(fc.webUrl(), { maxLength: 5 }),
          }),
          (contacts) => {
            // Arrange
            document.body.innerHTML = `
              <section class="pv-contact-info">
                ${contacts.email ? `<a href="mailto:${contacts.email}">Email</a>` : ""}
                ${contacts.phone ? `<span class="t-14 t-black t-normal">${contacts.phone}</span>` : ""}
                ${contacts.socialLinks.map((link) => `<a href="${link}">Link</a>`).join("")}
              </section>
            `;
            const adapter = new LinkedInAdapter();

            // Act
            const result = adapter.extractContacts();

            // Assert
            expect(result).toHaveProperty("email");
            expect(result).toHaveProperty("phone");
            expect(result).toHaveProperty("socialLinks");
            expect(result.email).toBe(contacts.email);
            expect(result.phone).toBe(
              contacts.phone ? contacts.phone.trim() : null,
            );
            expect(result.socialLinks).toHaveLength(
              contacts.socialLinks.length,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("HeadHunter: контактная информация должна быть извлечена если доступна", () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.option(fc.emailAddress(), { nil: null }),
            phone: fc.option(
              fc
                .string({ minLength: 5, maxLength: 20 })
                .filter(
                  (s) =>
                    s.trim().length > 0 && !s.includes("<") && !s.includes(">"),
                ),
              {
                nil: null,
              },
            ),
            socialLinks: fc.array(fc.webUrl(), { maxLength: 5 }),
          }),
          (contacts) => {
            // Arrange
            document.body.innerHTML = `
              ${contacts.email ? `<div data-qa="resume-contact-email">${contacts.email}</div>` : ""}
              ${contacts.phone ? `<div data-qa="resume-contact-phone">${contacts.phone}</div>` : ""}
              ${contacts.socialLinks.length > 0 ? `<div data-qa="resume-contact-site">${contacts.socialLinks.map((link) => `<a href="${link}">Link</a>`).join("")}</div>` : ""}
            `;
            const adapter = new HeadHunterAdapter();

            // Act
            const result = adapter.extractContacts();

            // Assert
            expect(result).toHaveProperty("email");
            expect(result).toHaveProperty("phone");
            expect(result).toHaveProperty("socialLinks");
            expect(result.email).toBe(contacts.email);
            expect(result.phone).toBe(
              contacts.phone ? contacts.phone.trim() : null,
            );
            expect(result.socialLinks).toHaveLength(
              contacts.socialLinks.length,
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
