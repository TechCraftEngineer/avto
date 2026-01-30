import { eq, lt } from "drizzle-orm";
import type { DbClient } from "../index";
import {
  type DraftData,
  type NewVacancyDraft,
  type VacancyDraft,
  vacancyDraft,
} from "../schema/vacancy/vacancy-draft";

/**
 * Репозиторий для работы с черновиками вакансий
 * Обеспечивает CRUD операции и маппинг между БД и доменными объектами
 */
export class DraftRepository {
  constructor(private db: DbClient) {}

  /**
   * Найти черновик по userId
   * Возвращает только один активный черновик пользователя
   */
  async findByUserId(userId: string): Promise<VacancyDraft | null> {
    const result = await this.db.query.vacancyDraft.findFirst({
      where: eq(vacancyDraft.userId, userId),
    });

    return result ?? null;
  }

  /**
   * Создать новый черновик или обновить существующий (upsert)
   * Автоматически сериализует данные в JSONB
   * Использует onConflict для атомарности операции
   */
  async create(data: {
    userId: string;
    conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
    }>;
    vacancyData: {
      title?: string;
      description?: string;
      requirements?: string[];
      conditions?: string[];
      salary?: {
        min?: number;
        max?: number;
        currency?: string;
      };
    };
    currentStep: string;
  }): Promise<VacancyDraft> {
    // Сериализация данных для хранения в JSONB
    const draftData: DraftData = {
      conversationHistory: data.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      })),
      vacancyData: data.vacancyData,
      currentStep: data.currentStep,
    };

    const newDraft: NewVacancyDraft = {
      userId: data.userId,
      draftData,
    };

    const [created] = await this.db
      .insert(vacancyDraft)
      .values(newDraft)
      .onConflictDoUpdate({
        target: vacancyDraft.userId,
        set: {
          draftData,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!created) {
      throw new Error("Не удалось создать черновик");
    }

    return created;
  }

  /**
   * Обновить существующий черновик
   * Выполняет частичное обновление данных
   */
  async update(
    id: string,
    data: {
      conversationHistory?: Array<{
        role: "user" | "assistant";
        content: string;
        timestamp: Date;
      }>;
      vacancyData?: {
        title?: string;
        description?: string;
        requirements?: string[];
        conditions?: string[];
        salary?: {
          min?: number;
          max?: number;
          currency?: string;
        };
      };
      currentStep?: string;
    },
  ): Promise<VacancyDraft> {
    // Получить существующий черновик
    const existing = await this.db.query.vacancyDraft.findFirst({
      where: eq(vacancyDraft.id, id),
    });

    if (!existing) {
      throw new Error("Черновик не найден");
    }

    // Десериализация существующих данных
    const existingData = existing.draftData as DraftData;

    // Глубокое слияние для вложенных объектов (особенно salary)
    const mergedVacancyData = data.vacancyData
      ? {
          ...existingData.vacancyData,
          ...data.vacancyData,
          // Проверяем явное наличие поля salary, а не его значение
          salary: Object.hasOwn(data.vacancyData, "salary")
            ? data.vacancyData.salary === undefined
              ? undefined
              : {
                  ...existingData.vacancyData.salary,
                  ...data.vacancyData.salary,
                }
            : existingData.vacancyData.salary,
        }
      : existingData.vacancyData;

    // Объединение данных
    const updatedData: DraftData = {
      conversationHistory: data.conversationHistory
        ? data.conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
          }))
        : existingData.conversationHistory,
      vacancyData: mergedVacancyData,
      currentStep: data.currentStep ?? existingData.currentStep,
    };

    const [updated] = await this.db
      .update(vacancyDraft)
      .set({
        draftData: updatedData,
        updatedAt: new Date(),
      })
      .where(eq(vacancyDraft.id, id))
      .returning();

    if (!updated) {
      throw new Error("Не удалось обновить черновик");
    }

    return updated;
  }

  /**
   * Удалить черновик по ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(vacancyDraft).where(eq(vacancyDraft.id, id));
  }

  /**
   * Удалить черновик по userId
   */
  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(vacancyDraft).where(eq(vacancyDraft.userId, userId));
  }

  /**
   * Найти устаревшие черновики (старше указанного количества дней)
   * Используется для фоновой очистки
   */
  async findExpired(daysOld: number): Promise<VacancyDraft[]> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - daysOld);

    const results = await this.db.query.vacancyDraft.findMany({
      where: lt(vacancyDraft.updatedAt, expirationDate),
    });

    return results;
  }

  /**
   * Удалить устаревшие черновики (старше указанного количества дней)
   * Возвращает количество удаленных записей
   */
  async deleteExpired(daysOld: number): Promise<number> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - daysOld);

    const result = await this.db
      .delete(vacancyDraft)
      .where(lt(vacancyDraft.updatedAt, expirationDate))
      .returning();

    return result.length;
  }

  /**
   * Проверить, устарел ли черновик (старше 7 дней)
   */
  isExpired(draft: VacancyDraft, daysOld = 7): boolean {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - daysOld);
    return draft.updatedAt < expirationDate;
  }

  /**
   * Маппинг из БД записи в доменный объект
   * Десериализует JSONB данные и преобразует ISO строки в Date
   */
  mapToDomain(dbRecord: VacancyDraft): {
    id: string;
    userId: string;
    conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
    }>;
    vacancyData: {
      title?: string;
      description?: string;
      requirements?: string[];
      conditions?: string[];
      salary?: {
        min?: number;
        max?: number;
        currency?: string;
      };
    };
    currentStep: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    const data = dbRecord.draftData as DraftData;

    return {
      id: dbRecord.id,
      userId: dbRecord.userId,
      conversationHistory: data.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      })),
      vacancyData: data.vacancyData,
      currentStep: data.currentStep,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    };
  }
}
