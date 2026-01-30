import { describe, expect, it } from "vitest";
import {
  CreateDraftInputSchema,
  DraftSchema,
  MessageSchema,
  UpdateDraftInputSchema,
  VacancyDataSchema,
} from "./draft";

describe("Draft Schemas", () => {
  describe("MessageSchema", () => {
    it("должен валидировать корректное сообщение пользователя", () => {
      const validMessage = {
        role: "user" as const,
        content: "Создай вакансию для разработчика",
        timestamp: new Date(),
      };

      const result = MessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("должен валидировать корректное сообщение ассистента", () => {
      const validMessage = {
        role: "assistant" as const,
        content: "Конечно! Давайте начнем...",
        timestamp: new Date(),
      };

      const result = MessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
    });

    it("должен отклонять сообщение с невалидной ролью", () => {
      const invalidMessage = {
        role: "system",
        content: "Test",
        timestamp: new Date(),
      };

      const result = MessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it("должен отклонять сообщение без контента", () => {
      const invalidMessage = {
        role: "user",
        timestamp: new Date(),
      };

      const result = MessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });
  });

  describe("VacancyDataSchema", () => {
    it("должен валидировать полные данные вакансии", () => {
      const validData = {
        title: "Senior TypeScript разработчик",
        description: "Ищем опытного разработчика...",
        requirements: ["Опыт работы с TypeScript 3+ года", "Знание React"],
        conditions: ["Удаленная работа", "Гибкий график"],
        salary: {
          min: 200000,
          max: 300000,
          currency: "RUB",
        },
      };

      const result = VacancyDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("должен валидировать частичные данные вакансии", () => {
      const partialData = {
        title: "Senior разработчик",
      };

      const result = VacancyDataSchema.safeParse(partialData);
      expect(result.success).toBe(true);
    });

    it("должен валидировать пустой объект", () => {
      const emptyData = {};

      const result = VacancyDataSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
    });

    it("должен валидировать данные без зарплаты", () => {
      const dataWithoutSalary = {
        title: "Разработчик",
        description: "Описание",
        requirements: ["Требование 1"],
        conditions: ["Условие 1"],
      };

      const result = VacancyDataSchema.safeParse(dataWithoutSalary);
      expect(result.success).toBe(true);
    });
  });

  describe("DraftSchema", () => {
    it("должен валидировать полный черновик", () => {
      const validDraft = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "user-123",
        conversationHistory: [
          {
            role: "user" as const,
            content: "Создай вакансию",
            timestamp: new Date(),
          },
        ],
        vacancyData: {
          title: "Senior разработчик",
        },
        currentStep: "requirements",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = DraftSchema.safeParse(validDraft);
      expect(result.success).toBe(true);
    });

    it("должен отклонять черновик без обязательных полей", () => {
      const invalidDraft = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        userId: "user-123",
      };

      const result = DraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });

    it("должен отклонять черновик с невалидным UUID", () => {
      const invalidDraft = {
        id: "not-a-uuid",
        userId: "user-123",
        conversationHistory: [],
        vacancyData: {},
        currentStep: "initial",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = DraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });
  });

  describe("CreateDraftInputSchema", () => {
    it("должен использовать значения по умолчанию", () => {
      const input = {};

      const result = CreateDraftInputSchema.parse(input);
      expect(result.conversationHistory).toEqual([]);
      expect(result.vacancyData).toEqual({});
      expect(result.currentStep).toBe("initial");
    });

    it("должен валидировать входные данные с кастомными значениями", () => {
      const input = {
        conversationHistory: [
          {
            role: "user" as const,
            content: "Привет",
            timestamp: new Date(),
          },
        ],
        vacancyData: {
          title: "Разработчик",
        },
        currentStep: "title",
      };

      const result = CreateDraftInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("UpdateDraftInputSchema", () => {
    it("должен валидировать частичное обновление", () => {
      const update = {
        currentStep: "description",
      };

      const result = UpdateDraftInputSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("должен валидировать обновление истории диалога", () => {
      const update = {
        conversationHistory: [
          {
            role: "user" as const,
            content: "Новое сообщение",
            timestamp: new Date(),
          },
        ],
      };

      const result = UpdateDraftInputSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("должен валидировать обновление данных вакансии", () => {
      const update = {
        vacancyData: {
          title: "Обновленное название",
          description: "Обновленное описание",
        },
      };

      const result = UpdateDraftInputSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("должен валидировать пустое обновление", () => {
      const update = {};

      const result = UpdateDraftInputSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });
});
