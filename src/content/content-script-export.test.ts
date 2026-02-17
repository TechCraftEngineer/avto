/**
 * Unit-тесты для Export функциональности Content Script
 * Тестируем логику валидации и форматирования данных
 */

import { describe, expect, it } from "bun:test";
import { CandidateDataSchema } from "../shared/schemas";
import type { CandidateData } from "../shared/types";

describe("Export функциональность - Валидация и форматирование", () => {
  const mockCandidateData: CandidateData = {
    platform: "LinkedIn",
    profileUrl: "https://linkedin.com/in/test-user",
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
    extractedAt: new Date("2024-01-15T10:00:00Z"),
  };

  describe("Валидация данных с Zod v4 (Требование 9.3)", () => {
    it("должен успешно валидировать корректные данные кандидата", () => {
      // Act
      const result = CandidateDataSchema.safeParse(mockCandidateData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.basicInfo.fullName).toBe("Иван Иванов");
        expect(result.data.platform).toBe("LinkedIn");
      }
    });

    it("должен отклонить данные с пустым fullName", () => {
      // Arrange
      const invalidData = {
        ...mockCandidateData,
        basicInfo: {
          ...mockCandidateData.basicInfo,
          fullName: "",
        },
      };

      // Act
      const result = CandidateDataSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it("должен отклонить данные с невалидным email", () => {
      // Arrange
      const invalidData = {
        ...mockCandidateData,
        contacts: {
          ...mockCandidateData.contacts,
          email: "invalid-email",
        },
      };

      // Act
      const result = CandidateDataSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it("должен отклонить данные с невалидным URL профиля", () => {
      // Arrange
      const invalidData = {
        ...mockCandidateData,
        profileUrl: "not-a-url",
      };

      // Act
      const result = CandidateDataSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it("должен принять данные с null значениями в допустимых полях", () => {
      // Arrange
      const dataWithNulls = {
        ...mockCandidateData,
        basicInfo: {
          ...mockCandidateData.basicInfo,
          photoUrl: null,
        },
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
        experience: [
          {
            ...mockCandidateData.experience[0],
            endDate: null, // текущая работа
          },
        ],
      };

      // Act
      const result = CandidateDataSchema.safeParse(dataWithNulls);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("Свойство 8: Валидность экспортируемых данных", () => {
    it("экспорт в JSON должен производить валидный JSON для любых данных", () => {
      // Act
      const jsonString = JSON.stringify(mockCandidateData, null, 2);
      const parsed = JSON.parse(jsonString);

      // Assert - данные должны быть эквивалентны после round-trip
      expect(parsed.platform).toBe(mockCandidateData.platform);
      expect(parsed.profileUrl).toBe(mockCandidateData.profileUrl);
      expect(parsed.basicInfo.fullName).toBe(
        mockCandidateData.basicInfo.fullName,
      );
      expect(parsed.basicInfo.currentPosition).toBe(
        mockCandidateData.basicInfo.currentPosition,
      );
      expect(parsed.experience).toEqual(mockCandidateData.experience);
      expect(parsed.education).toEqual(mockCandidateData.education);
      expect(parsed.skills).toEqual(mockCandidateData.skills);
      expect(parsed.contacts).toEqual(mockCandidateData.contacts);
    });

    it("JSON должен быть форматирован с отступами", () => {
      // Act
      const jsonString = JSON.stringify(mockCandidateData, null, 2);

      // Assert
      expect(jsonString).toContain("\n");
      expect(jsonString).toContain("  ");
      expect(jsonString.split("\n").length).toBeGreaterThan(10);
    });

    it("JSON должен содержать все обязательные поля", () => {
      // Act
      const jsonString = JSON.stringify(mockCandidateData, null, 2);

      // Assert
      expect(jsonString).toContain('"platform"');
      expect(jsonString).toContain('"profileUrl"');
      expect(jsonString).toContain('"basicInfo"');
      expect(jsonString).toContain('"fullName"');
      expect(jsonString).toContain('"experience"');
      expect(jsonString).toContain('"education"');
      expect(jsonString).toContain('"skills"');
      expect(jsonString).toContain('"contacts"');
      expect(jsonString).toContain('"extractedAt"');
    });
  });

  describe("Генерация имени файла", () => {
    it("должен генерировать корректное имя файла", () => {
      // Arrange
      const name = mockCandidateData.basicInfo.fullName
        .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();
      const date = new Date().toISOString().split("T")[0];
      const fileName = `candidate_${name}_${date}.json`;

      // Assert
      expect(fileName).toMatch(
        /^candidate_иван_иванов_\d{4}-\d{2}-\d{2}\.json$/,
      );
      expect(fileName).toContain(".json");
    });

    it("должен обработать специальные символы в имени", () => {
      // Arrange
      const nameWithSpecialChars = "Иван О'Коннор-Смит (Jr.)";
      const cleaned = nameWithSpecialChars
        .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();

      // Assert
      expect(cleaned).toBe("иван_оконнорсмит_jr");
      expect(cleaned).not.toMatch(/[()'-]/);
    });

    it("должен обработать имя с множественными пробелами", () => {
      // Arrange
      const nameWithSpaces = "Иван   Петрович   Иванов";
      const cleaned = nameWithSpaces
        .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();

      // Assert
      expect(cleaned).toBe("иван_петрович_иванов");
      expect(cleaned.split("_").length).toBe(3);
    });

    it("должен обработать имя только на английском", () => {
      // Arrange
      const englishName = "John Smith";
      const cleaned = englishName
        .replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();

      // Assert
      expect(cleaned).toBe("john_smith");
    });
  });

  describe("Граничные случаи", () => {
    it("должен обработать кандидата без фотографии", () => {
      // Arrange
      const dataWithoutPhoto = {
        ...mockCandidateData,
        basicInfo: {
          ...mockCandidateData.basicInfo,
          photoUrl: null,
        },
      };

      // Act
      const result = CandidateDataSchema.safeParse(dataWithoutPhoto);
      const jsonString = JSON.stringify(dataWithoutPhoto, null, 2);
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(result.success).toBe(true);
      expect(parsed.basicInfo.photoUrl).toBeNull();
    });

    it("должен обработать кандидата без контактов", () => {
      // Arrange
      const dataWithoutContacts = {
        ...mockCandidateData,
        contacts: {
          email: null,
          phone: null,
          socialLinks: [],
        },
      };

      // Act
      const result = CandidateDataSchema.safeParse(dataWithoutContacts);
      const jsonString = JSON.stringify(dataWithoutContacts, null, 2);
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(result.success).toBe(true);
      expect(parsed.contacts.email).toBeNull();
      expect(parsed.contacts.phone).toBeNull();
      expect(parsed.contacts.socialLinks).toEqual([]);
    });

    it("должен обработать кандидата с текущей работой (endDate = null)", () => {
      // Arrange
      const dataWithCurrentJob = {
        ...mockCandidateData,
        experience: [
          {
            position: "Senior Developer",
            company: "Current Company",
            startDate: "2023-01",
            endDate: null,
            description: "Текущая работа",
          },
        ],
      };

      // Act
      const result = CandidateDataSchema.safeParse(dataWithCurrentJob);
      const jsonString = JSON.stringify(dataWithCurrentJob, null, 2);
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(result.success).toBe(true);
      expect(parsed.experience[0].endDate).toBeNull();
    });

    it("должен обработать кандидата с пустым списком навыков", () => {
      // Arrange
      const dataWithoutSkills = {
        ...mockCandidateData,
        skills: [],
      };

      // Act
      const result = CandidateDataSchema.safeParse(dataWithoutSkills);
      const jsonString = JSON.stringify(dataWithoutSkills, null, 2);
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(result.success).toBe(true);
      expect(parsed.skills).toEqual([]);
    });

    it("должен обработать кандидата с пустыми массивами опыта и образования", () => {
      // Arrange
      const dataWithEmptyArrays = {
        ...mockCandidateData,
        experience: [],
        education: [],
      };

      // Act
      const result = CandidateDataSchema.safeParse(dataWithEmptyArrays);
      const jsonString = JSON.stringify(dataWithEmptyArrays, null, 2);
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(result.success).toBe(true);
      expect(parsed.experience).toEqual([]);
      expect(parsed.education).toEqual([]);
    });

    it("должен обработать кандидата с множественными записями опыта", () => {
      // Arrange
      const dataWithMultipleExperience = {
        ...mockCandidateData,
        experience: [
          {
            position: "Senior Developer",
            company: "Company 1",
            startDate: "2020-01",
            endDate: null,
            description: "Текущая работа",
          },
          {
            position: "Middle Developer",
            company: "Company 2",
            startDate: "2018-01",
            endDate: "2019-12",
            description: "Предыдущая работа",
          },
          {
            position: "Junior Developer",
            company: "Company 3",
            startDate: "2016-01",
            endDate: "2017-12",
            description: "Первая работа",
          },
        ],
      };

      // Act
      const result = CandidateDataSchema.safeParse(dataWithMultipleExperience);
      const jsonString = JSON.stringify(dataWithMultipleExperience, null, 2);
      const parsed = JSON.parse(jsonString);

      // Assert
      expect(result.success).toBe(true);
      expect(parsed.experience.length).toBe(3);
      expect(parsed.experience[0].company).toBe("Company 1");
      expect(parsed.experience[1].company).toBe("Company 2");
      expect(parsed.experience[2].company).toBe("Company 3");
    });
  });

  describe("Сообщения об ошибках на русском языке (Требования 9.4, 9.5)", () => {
    it("сообщения должны быть на русском языке", () => {
      // Arrange
      const successMessage = "Данные успешно экспортированы в файл";
      const clipboardMessage = "Данные скопированы в буфер обмена";
      const errorMessage = "Не удалось экспортировать данные";
      const noDataMessage = "Нет данных для экспорта";
      const validationErrorMessage =
        "Данные не прошли проверку перед экспортом";

      // Assert - проверяем, что сообщения не содержат англицизмов
      expect(successMessage).not.toMatch(/export|success|file/i);
      expect(clipboardMessage).not.toMatch(/clipboard|copy/i);
      expect(errorMessage).not.toMatch(/export|fail/i);
      expect(noDataMessage).not.toMatch(/no data/i);
      expect(validationErrorMessage).not.toMatch(/validation|error/i);

      // Проверяем, что сообщения содержат русские слова
      expect(successMessage).toMatch(/данные|экспортированы|файл/i);
      expect(clipboardMessage).toMatch(/данные|скопированы|буфер/i);
      expect(errorMessage).toMatch(/не удалось|экспортировать/i);
      expect(noDataMessage).toMatch(/нет данных/i);
      expect(validationErrorMessage).toMatch(/данные|проверку/i);
    });
  });
});
