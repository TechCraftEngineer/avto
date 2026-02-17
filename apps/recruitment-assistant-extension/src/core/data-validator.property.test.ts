/**
 * Property-based тесты для валидации данных
 */

import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import { DataValidator } from "./data-validator";

/**
 * Генератор для записи об опыте работы
 */
function experienceEntryArbitrary() {
  return fc.record({
    position: fc.string({ minLength: 1 }),
    company: fc.string({ minLength: 1 }),
    startDate: fc.string(),
    endDate: fc.option(fc.string()),
    description: fc.string(),
  });
}

/**
 * Генератор для записи об образовании
 */
function educationEntryArbitrary() {
  return fc.record({
    institution: fc.string({ minLength: 1 }),
    degree: fc.string(),
    fieldOfStudy: fc.string(),
    startDate: fc.string(),
    endDate: fc.string(),
  });
}

/**
 * Генератор для контактной информации
 * Использует более строгий генератор email, совместимый с Zod
 */
function contactInfoArbitrary() {
  return fc.record({
    email: fc.option(
      fc
        .emailAddress()
        .filter((email) =>
          /^[A-Za-z0-9_+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}$/.test(email),
        ),
    ),
    phone: fc.option(fc.string()),
    socialLinks: fc.array(fc.webUrl()),
  });
}

/**
 * Генератор для данных кандидата
 */
function candidateDataArbitrary() {
  return fc.record({
    platform: fc.constantFrom("LinkedIn", "HeadHunter"),
    profileUrl: fc.webUrl(),
    basicInfo: fc.record({
      fullName: fc.string({ minLength: 1 }),
      currentPosition: fc.string(),
      location: fc.string(),
      photoUrl: fc.option(fc.webUrl()),
    }),
    experience: fc.array(experienceEntryArbitrary()),
    education: fc.array(educationEntryArbitrary()),
    skills: fc.array(fc.string()),
    contacts: contactInfoArbitrary(),
    extractedAt: fc.date(),
  });
}

/**
 * Генератор для настроек
 */
function settingsArbitrary() {
  return fc.record({
    apiUrl: fc.webUrl(),
    apiToken: fc.string({ minLength: 10 }),
    fieldsToExtract: fc.record({
      basicInfo: fc.boolean(),
      experience: fc.boolean(),
      education: fc.boolean(),
      skills: fc.boolean(),
      contacts: fc.boolean(),
    }),
  });
}

describe("Property-based тесты для DataValidator", () => {
  const validator = new DataValidator();

  /**
   * **Validates: Requirements 9.3**
   * Feature: linkedin-parser-extension, Property 8: Валидность экспортируемых данных
   *
   * Для любых извлеченных данных кандидата, экспорт в JSON должен производить
   * валидный JSON, который можно распарсить обратно в эквивалентный объект CandidateData.
   */
  it("экспорт в JSON должен производить валидный JSON для любых данных", () => {
    fc.assert(
      fc.property(candidateDataArbitrary(), (data) => {
        // Act
        const json = JSON.stringify(data);
        const parsed = JSON.parse(json);

        // Assert - JSON должен быть валидным и парситься обратно
        expect(parsed).toBeDefined();
        expect(parsed.platform).toBe(data.platform);
        expect(parsed.profileUrl).toBe(data.profileUrl);
        expect(parsed.basicInfo.fullName).toBe(data.basicInfo.fullName);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 9.3**
   * Feature: linkedin-parser-extension, Property 8: Валидность экспортируемых данных
   *
   * Валидированные данные должны сохранять свою структуру после сериализации и десериализации.
   */
  it("валидированные данные должны сохранять структуру после JSON round-trip", () => {
    fc.assert(
      fc.property(candidateDataArbitrary(), (data) => {
        // Arrange
        const validated = validator.validate(data);

        // Act
        const json = JSON.stringify(validated);
        const parsed = JSON.parse(json);

        // Assert - Структура должна сохраниться
        expect(parsed.platform).toBe(validated.platform);
        expect(parsed.profileUrl).toBe(validated.profileUrl);
        expect(parsed.basicInfo).toBeDefined();
        expect(parsed.experience).toBeDefined();
        expect(parsed.education).toBeDefined();
        expect(parsed.skills).toBeDefined();
        expect(parsed.contacts).toBeDefined();
        expect(Array.isArray(parsed.experience)).toBe(true);
        expect(Array.isArray(parsed.education)).toBe(true);
        expect(Array.isArray(parsed.skills)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 14.5**
   * Feature: linkedin-parser-extension, Property 15: Валидация настроек
   *
   * Для любых настроек API, перед сохранением они должны пройти валидацию через Zod-схему,
   * и только валидные настройки должны быть сохранены.
   */
  it("только валидные настройки должны проходить валидацию", () => {
    fc.assert(
      fc.property(settingsArbitrary(), (settings) => {
        // Act & Assert - Валидные настройки не должны выбрасывать ошибку
        expect(() => validator.validateSettings(settings)).not.toThrow();

        const validated = validator.validateSettings(settings);
        expect(validated.apiUrl).toBe(settings.apiUrl);
        expect(validated.apiToken).toBe(settings.apiToken);
        expect(validated.fieldsToExtract).toEqual(settings.fieldsToExtract);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 9.3**
   * Feature: linkedin-parser-extension, Property 8: Валидность экспортируемых данных
   *
   * Валидация должна быть идемпотентной - повторная валидация валидных данных
   * должна возвращать эквивалентный результат.
   */
  it("валидация должна быть идемпотентной", () => {
    fc.assert(
      fc.property(candidateDataArbitrary(), (data) => {
        // Act
        const validated1 = validator.validate(data);
        const validated2 = validator.validate(validated1);

        // Assert - Повторная валидация должна вернуть эквивалентные данные
        expect(validated2.platform).toBe(validated1.platform);
        expect(validated2.profileUrl).toBe(validated1.profileUrl);
        expect(validated2.basicInfo.fullName).toBe(
          validated1.basicInfo.fullName,
        );
        expect(validated2.experience.length).toBe(validated1.experience.length);
        expect(validated2.education.length).toBe(validated1.education.length);
        expect(validated2.skills.length).toBe(validated1.skills.length);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 9.3**
   * Feature: linkedin-parser-extension, Property 8: Валидность экспортируемых данных
   *
   * Частичная валидация должна всегда возвращать объект, даже для невалидных данных.
   */
  it("validatePartial должен всегда возвращать объект", () => {
    fc.assert(
      fc.property(fc.object(), (data) => {
        // Act
        const result = validator.validatePartial(data);

        // Assert - Результат всегда должен быть объектом
        expect(result).toBeDefined();
        expect(typeof result).toBe("object");
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 9.3**
   * Feature: linkedin-parser-extension, Property 8: Валидность экспортируемых данных
   *
   * Валидные данные должны проходить как полную, так и частичную валидацию.
   */
  it("валидные данные должны проходить оба типа валидации", () => {
    fc.assert(
      fc.property(candidateDataArbitrary(), (data) => {
        // Act
        const fullValidation = validator.validate(data);
        const partialValidation = validator.validatePartial(data);

        // Assert - Оба метода должны вернуть данные
        expect(fullValidation).toBeDefined();
        expect(partialValidation).toBeDefined();
        expect(fullValidation.platform).toBe(partialValidation.platform);
        expect(fullValidation.profileUrl).toBe(partialValidation.profileUrl);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 14.5**
   * Feature: linkedin-parser-extension, Property 15: Валидация настроек
   *
   * Настройки с невалидным URL должны отклоняться валидатором.
   */
  it("настройки с невалидным URL должны отклоняться", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10 }),
        fc.record({
          basicInfo: fc.boolean(),
          experience: fc.boolean(),
          education: fc.boolean(),
          skills: fc.boolean(),
          contacts: fc.boolean(),
        }),
        (apiToken, fieldsToExtract) => {
          // Arrange - Создаем настройки с невалидным URL
          const invalidSettings = {
            apiUrl: "not-a-valid-url",
            apiToken,
            fieldsToExtract,
          };

          // Act & Assert - Должна выброситься ошибка
          expect(() => validator.validateSettings(invalidSettings)).toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 14.5**
   * Feature: linkedin-parser-extension, Property 15: Валидация настроек
   *
   * Настройки с коротким токеном (< 10 символов) должны отклоняться валидатором.
   */
  it("настройки с коротким токеном должны отклоняться", () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        fc.string({ maxLength: 9 }),
        fc.record({
          basicInfo: fc.boolean(),
          experience: fc.boolean(),
          education: fc.boolean(),
          skills: fc.boolean(),
          contacts: fc.boolean(),
        }),
        (apiUrl, shortToken, fieldsToExtract) => {
          // Arrange - Создаем настройки с коротким токеном
          const invalidSettings = {
            apiUrl,
            apiToken: shortToken,
            fieldsToExtract,
          };

          // Act & Assert - Должна выброситься ошибка
          expect(() => validator.validateSettings(invalidSettings)).toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 9.3**
   * Feature: linkedin-parser-extension, Property 8: Валидность экспортируемых данных
   *
   * Массивы в данных кандидата должны сохранять свою длину после валидации.
   */
  it("массивы должны сохранять длину после валидации", () => {
    fc.assert(
      fc.property(candidateDataArbitrary(), (data) => {
        // Act
        const validated = validator.validate(data);

        // Assert - Длины массивов должны совпадать
        expect(validated.experience.length).toBe(data.experience.length);
        expect(validated.education.length).toBe(data.education.length);
        expect(validated.skills.length).toBe(data.skills.length);
        expect(validated.contacts.socialLinks.length).toBe(
          data.contacts.socialLinks.length,
        );
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 9.3**
   * Feature: linkedin-parser-extension, Property 8: Валидность экспортируемых данных
   *
   * Null значения в необязательных полях должны сохраняться после валидации.
   */
  it("null значения должны сохраняться в необязательных полях", () => {
    fc.assert(
      fc.property(candidateDataArbitrary(), (data) => {
        // Act
        const validated = validator.validate(data);

        // Assert - Null значения должны сохраниться
        if (data.basicInfo.photoUrl === null) {
          expect(validated.basicInfo.photoUrl).toBeNull();
        }
        if (data.contacts.email === null) {
          expect(validated.contacts.email).toBeNull();
        }
        if (data.contacts.phone === null) {
          expect(validated.contacts.phone).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });
});
