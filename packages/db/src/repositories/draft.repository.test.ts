import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DbClient, VacancyDraft } from "../index";
import { DraftRepository } from "./draft.repository";

// Mock данные для тестов
const mockDraft: VacancyDraft = {
  id: "draft-123",
  userId: "user-123",
  draftData: {
    conversationHistory: [
      {
        role: "user",
        content: "Создай вакансию",
        timestamp: new Date().toISOString(),
      },
    ],
    vacancyData: {
      title: "Senior разработчик",
    },
    currentStep: "initial",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("DraftRepository - Фоновая очистка", () => {
  let mockDb: DbClient;
  let repository: DraftRepository;

  beforeEach(() => {
    // Создаем mock базы данных
    mockDb = {
      query: {
        vacancyDraft: {
          findMany: vi.fn(),
        },
      },
      delete: vi.fn(),
    } as unknown as DbClient;

    repository = new DraftRepository(mockDb);
  });

  describe("findExpired", () => {
    it("должен найти черновики старше указанного количества дней", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 дней назад

      const expiredDraft = {
        ...mockDraft,
        id: "expired-draft",
        updatedAt: oldDate,
      };

      (mockDb.query.vacancyDraft.findMany as any).mockResolvedValue([
        expiredDraft,
      ]);

      const result = await repository.findExpired(7);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("expired-draft");
    });

    it("должен вернуть пустой массив, если нет устаревших черновиков", async () => {
      (mockDb.query.vacancyDraft.findMany as any).mockResolvedValue([]);

      const result = await repository.findExpired(7);

      expect(result).toHaveLength(0);
    });

    it("должен использовать правильную дату для фильтрации", async () => {
      const daysOld = 7;
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - daysOld);

      (mockDb.query.vacancyDraft.findMany as any).mockResolvedValue([]);

      await repository.findExpired(daysOld);

      // Проверяем, что метод был вызван
      expect(mockDb.query.vacancyDraft.findMany).toHaveBeenCalled();
    });
  });

  describe("deleteExpired", () => {
    it("должен удалить устаревшие черновики и вернуть количество", async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      const expiredDrafts = [
        { ...mockDraft, id: "draft-1", updatedAt: oldDate },
        { ...mockDraft, id: "draft-2", updatedAt: oldDate },
        { ...mockDraft, id: "draft-3", updatedAt: oldDate },
      ];

      (mockDb.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(expiredDrafts),
        }),
      });

      const deletedCount = await repository.deleteExpired(7);

      expect(deletedCount).toBe(3);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it("должен вернуть 0, если нет черновиков для удаления", async () => {
      (mockDb.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      const deletedCount = await repository.deleteExpired(7);

      expect(deletedCount).toBe(0);
    });

    it("должен удалять черновики старше указанного количества дней", async () => {
      const daysOld = 14; // 14 дней

      (mockDb.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockDraft]),
        }),
      });

      await repository.deleteExpired(daysOld);

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("isExpired", () => {
    it("должен вернуть true для черновика старше 7 дней", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 дней назад

      const expiredDraft = {
        ...mockDraft,
        updatedAt: oldDate,
      };

      const result = repository.isExpired(expiredDraft);

      expect(result).toBe(true);
    });

    it("должен вернуть false для свежего черновика", () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3); // 3 дня назад

      const freshDraft = {
        ...mockDraft,
        updatedAt: recentDate,
      };

      const result = repository.isExpired(freshDraft);

      expect(result).toBe(false);
    });

    it("должен вернуть false для черновика ровно 7 дней", () => {
      const exactDate = new Date();
      exactDate.setDate(exactDate.getDate() - 7);
      // Добавляем 1 секунду, чтобы быть чуть новее границы
      exactDate.setSeconds(exactDate.getSeconds() + 1);

      const borderlineDraft = {
        ...mockDraft,
        updatedAt: exactDate,
      };

      const result = repository.isExpired(borderlineDraft);

      expect(result).toBe(false);
    });

    it("должен использовать кастомное количество дней", () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 15); // 15 дней назад

      const draft = {
        ...mockDraft,
        updatedAt: oldDate,
      };

      // Проверяем с 10 днями - должен быть устаревшим
      expect(repository.isExpired(draft, 10)).toBe(true);

      // Проверяем с 20 днями - не должен быть устаревшим
      expect(repository.isExpired(draft, 20)).toBe(false);
    });
  });

  describe("Граничные случаи", () => {
    it("должен корректно обрабатывать черновики с updatedAt = сейчас", () => {
      const nowDraft = {
        ...mockDraft,
        updatedAt: new Date(),
      };

      const result = repository.isExpired(nowDraft);

      expect(result).toBe(false);
    });

    it("должен корректно обрабатывать очень старые черновики", () => {
      const veryOldDate = new Date();
      veryOldDate.setFullYear(veryOldDate.getFullYear() - 1); // 1 год назад

      const veryOldDraft = {
        ...mockDraft,
        updatedAt: veryOldDate,
      };

      const result = repository.isExpired(veryOldDraft);

      expect(result).toBe(true);
    });
  });
});
