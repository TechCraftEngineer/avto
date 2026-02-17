/**
 * Unit-тесты для DataValidator
 */

import { describe, expect, it } from "bun:test";
import { z } from "zod";
import type { CandidateData, Settings } from "../shared/types";
import { DataValidator } from "./data-validator";

describe("DataValidator", () => {
  const validator = new DataValidator();

  describe("validate", () => {
    it("должен успешно валидировать корректные данные кандидата", () => {
      // Arrange
      const validData: CandidateData = {
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
            company: "Tech Corp",
            startDate: "2020-01",
            endDate: null,
            description: "Разработка веб-приложений",
          },
        ],
        education: [
          {
            institution: "МГУ",
            degree: "Бакалавр",
            fieldOfStudy: "Информатика",
            startDate: "2015",
            endDate: "2019",
          },
        ],
        skills: ["JavaScript", "TypeScript", "React"],
        contacts: {
          email: "ivan@example.com",
          phone: "+7 (999) 123-45-67",
          socialLinks: ["https://github.com/ivan"],
        },
        extractedAt: new Date(),
      };

      // Act
      const result = validator.validate(validData);

      // Assert
      expect(result).toEqual(validData);
    });

    it("должен выбросить ошибку для данных с пустым именем", () => {
      // Arrange
      const invalidData = {
        platform: "LinkedIn",
        profileUrl: "https://www.linkedin.com/in/john-doe/",
        basicInfo: {
          fullName: "",
          currentPosition: "Developer",
          location: "Москва",
          photoUrl: null,
        },
        experience: [],
        education: [],
        skills: [],
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
        extractedAt: new Date(),
      };

      // Act & Assert
      expect(() => validator.validate(invalidData)).toThrow(z.ZodError);
    });

    it("должен выбросить ошибку для невалидного URL профиля", () => {
      // Arrange
      const invalidData = {
        platform: "LinkedIn",
        profileUrl: "not-a-valid-url",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Developer",
          location: "Москва",
          photoUrl: null,
        },
        experience: [],
        education: [],
        skills: [],
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
        extractedAt: new Date(),
      };

      // Act & Assert
      expect(() => validator.validate(invalidData)).toThrow(z.ZodError);
    });

    it("должен выбросить ошибку для невалидного email", () => {
      // Arrange
      const invalidData = {
        platform: "LinkedIn",
        profileUrl: "https://www.linkedin.com/in/john-doe/",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Developer",
          location: "Москва",
          photoUrl: null,
        },
        experience: [],
        education: [],
        skills: [],
        contacts: {
          email: "not-an-email",
          phone: null,
          socialLinks: [],
        },
        extractedAt: new Date(),
      };

      // Act & Assert
      expect(() => validator.validate(invalidData)).toThrow(z.ZodError);
    });

    it("должен выбросить ошибку для невалидных социальных ссылок", () => {
      // Arrange
      const invalidData = {
        platform: "LinkedIn",
        profileUrl: "https://www.linkedin.com/in/john-doe/",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Developer",
          location: "Москва",
          photoUrl: null,
        },
        experience: [],
        education: [],
        skills: [],
        contacts: {
          email: null,
          phone: null,
          socialLinks: ["not-a-url", "also-not-a-url"],
        },
        extractedAt: new Date(),
      };

      // Act & Assert
      expect(() => validator.validate(invalidData)).toThrow(z.ZodError);
    });

    it("должен принять null для необязательных полей", () => {
      // Arrange
      const validData: CandidateData = {
        platform: "LinkedIn",
        profileUrl: "https://www.linkedin.com/in/john-doe/",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Developer",
          location: "Москва",
          photoUrl: null,
        },
        experience: [],
        education: [],
        skills: [],
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
        extractedAt: new Date(),
      };

      // Act
      const result = validator.validate(validData);

      // Assert
      expect(result.basicInfo.photoUrl).toBeNull();
      expect(result.contacts.email).toBeNull();
      expect(result.contacts.phone).toBeNull();
    });

    it("должен валидировать данные с текущей работой (endDate = null)", () => {
      // Arrange
      const validData: CandidateData = {
        platform: "LinkedIn",
        profileUrl: "https://www.linkedin.com/in/john-doe/",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Senior Developer",
          location: "Москва",
          photoUrl: null,
        },
        experience: [
          {
            position: "Senior Developer",
            company: "Current Company",
            startDate: "2022-01",
            endDate: null,
            description: "Текущая работа",
          },
        ],
        education: [],
        skills: [],
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
        extractedAt: new Date(),
      };

      // Act
      const result = validator.validate(validData);

      // Assert
      expect(result.experience[0].endDate).toBeNull();
    });

    it("должен валидировать данные с множественными записями опыта и образования", () => {
      // Arrange
      const validData: CandidateData = {
        platform: "HeadHunter",
        profileUrl: "https://hh.ru/resume/12345",
        basicInfo: {
          fullName: "Петр Петров",
          currentPosition: "Tech Lead",
          location: "Санкт-Петербург",
          photoUrl: "https://example.com/photo.jpg",
        },
        experience: [
          {
            position: "Tech Lead",
            company: "Company A",
            startDate: "2020-01",
            endDate: null,
            description: "Руководство командой",
          },
          {
            position: "Senior Developer",
            company: "Company B",
            startDate: "2018-01",
            endDate: "2019-12",
            description: "Разработка",
          },
        ],
        education: [
          {
            institution: "СПбГУ",
            degree: "Магистр",
            fieldOfStudy: "Программная инженерия",
            startDate: "2019",
            endDate: "2021",
          },
          {
            institution: "СПбГУ",
            degree: "Бакалавр",
            fieldOfStudy: "Информатика",
            startDate: "2015",
            endDate: "2019",
          },
        ],
        skills: ["Python", "Django", "PostgreSQL", "Docker"],
        contacts: {
          email: "petr@example.com",
          phone: "+7 (999) 987-65-43",
          socialLinks: ["https://github.com/petr", "https://gitlab.com/petr"],
        },
        extractedAt: new Date(),
      };

      // Act
      const result = validator.validate(validData);

      // Assert
      expect(result.experience).toHaveLength(2);
      expect(result.education).toHaveLength(2);
      expect(result.skills).toHaveLength(4);
      expect(result.contacts.socialLinks).toHaveLength(2);
    });
  });

  describe("validatePartial", () => {
    it("должен вернуть валидные данные для корректного объекта", () => {
      // Arrange
      const validData: CandidateData = {
        platform: "LinkedIn",
        profileUrl: "https://www.linkedin.com/in/john-doe/",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Developer",
          location: "Москва",
          photoUrl: null,
        },
        experience: [],
        education: [],
        skills: [],
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
        extractedAt: new Date(),
      };

      // Act
      const result = validator.validatePartial(validData);

      // Assert
      expect(result).toEqual(validData);
    });

    it("должен вернуть частичные данные для невалидного объекта", () => {
      // Arrange
      const invalidData = {
        platform: "LinkedIn",
        profileUrl: "not-a-url",
        basicInfo: {
          fullName: "",
          currentPosition: "Developer",
          location: "Москва",
          photoUrl: null,
        },
        experience: [],
        education: [],
        skills: [],
        contacts: {
          email: "not-an-email",
          phone: null,
          socialLinks: ["not-a-url"],
        },
        extractedAt: new Date(),
      };

      // Act
      const result = validator.validatePartial(invalidData);

      // Assert
      expect(result).toBeDefined();
      expect(result.platform).toBe("LinkedIn");
    });

    it("должен обработать частично заполненные данные", () => {
      // Arrange
      const partialData = {
        platform: "LinkedIn",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Developer",
        },
      };

      // Act
      const result = validator.validatePartial(partialData);

      // Assert
      expect(result).toBeDefined();
      expect(result.platform).toBe("LinkedIn");
    });
  });

  describe("validateSettings", () => {
    it("должен успешно валидировать корректные настройки", () => {
      // Arrange
      const validSettings: Settings = {
        apiUrl: "https://api.example.com",
        apiToken: "valid-token-123456",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: false,
        },
      };

      // Act
      const result = validator.validateSettings(validSettings);

      // Assert
      expect(result).toEqual(validSettings);
    });

    it("должен выбросить ошибку для невалидного URL API", () => {
      // Arrange
      const invalidSettings = {
        apiUrl: "not-a-url",
        apiToken: "valid-token-123456",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      };

      // Act & Assert
      expect(() => validator.validateSettings(invalidSettings)).toThrow(
        z.ZodError,
      );
    });

    it("должен выбросить ошибку для короткого токена", () => {
      // Arrange
      const invalidSettings = {
        apiUrl: "https://api.example.com",
        apiToken: "short",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      };

      // Act & Assert
      expect(() => validator.validateSettings(invalidSettings)).toThrow(
        z.ZodError,
      );
    });

    it("должен выбросить ошибку для отсутствующих полей fieldsToExtract", () => {
      // Arrange
      const invalidSettings = {
        apiUrl: "https://api.example.com",
        apiToken: "valid-token-123456",
        fieldsToExtract: {
          basicInfo: true,
          // Отсутствуют остальные поля
        },
      };

      // Act & Assert
      expect(() => validator.validateSettings(invalidSettings)).toThrow(
        z.ZodError,
      );
    });

    it("должен валидировать настройки со всеми полями false", () => {
      // Arrange
      const validSettings: Settings = {
        apiUrl: "https://api.example.com",
        apiToken: "valid-token-123456",
        fieldsToExtract: {
          basicInfo: false,
          experience: false,
          education: false,
          skills: false,
          contacts: false,
        },
      };

      // Act
      const result = validator.validateSettings(validSettings);

      // Assert
      expect(result).toEqual(validSettings);
      expect(result.fieldsToExtract.basicInfo).toBe(false);
    });
  });

  describe("граничные случаи", () => {
    it("должен обработать пустые массивы", () => {
      // Arrange
      const validData: CandidateData = {
        platform: "LinkedIn",
        profileUrl: "https://www.linkedin.com/in/john-doe/",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Developer",
          location: "Москва",
          photoUrl: null,
        },
        experience: [],
        education: [],
        skills: [],
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
        extractedAt: new Date(),
      };

      // Act
      const result = validator.validate(validData);

      // Assert
      expect(result.experience).toEqual([]);
      expect(result.education).toEqual([]);
      expect(result.skills).toEqual([]);
      expect(result.contacts.socialLinks).toEqual([]);
    });

    it("должен обработать пустые строки в необязательных полях", () => {
      // Arrange
      const validData: CandidateData = {
        platform: "LinkedIn",
        profileUrl: "https://www.linkedin.com/in/john-doe/",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "",
          location: "",
          photoUrl: null,
        },
        experience: [
          {
            position: "Developer",
            company: "Company",
            startDate: "",
            endDate: "",
            description: "",
          },
        ],
        education: [],
        skills: [],
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
        extractedAt: new Date(),
      };

      // Act
      const result = validator.validate(validData);

      // Assert
      expect(result.basicInfo.currentPosition).toBe("");
      expect(result.basicInfo.location).toBe("");
      expect(result.experience[0].description).toBe("");
    });

    it("должен обработать данные с очень длинными строками", () => {
      // Arrange
      const longString = "a".repeat(10000);
      const validData: CandidateData = {
        platform: "LinkedIn",
        profileUrl: "https://www.linkedin.com/in/john-doe/",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: longString,
          location: "Москва",
          photoUrl: null,
        },
        experience: [],
        education: [],
        skills: [],
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
        extractedAt: new Date(),
      };

      // Act
      const result = validator.validate(validData);

      // Assert
      expect(result.basicInfo.currentPosition).toBe(longString);
    });
  });
});
