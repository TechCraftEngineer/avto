/**
 * Unit-тесты и Property-based тесты для StorageManager
 */

import { beforeEach, describe, expect, it, mock } from "bun:test";
import fc from "fast-check";
import { SettingsSchema } from "../shared/schemas";
import type { CandidateData, Settings } from "../shared/types";
import { StorageManager } from "./storage-manager";

// Mock Chrome Storage API
const mockStorage = {
  local: {
    get: mock(() => Promise.resolve({})),
    set: mock(() => Promise.resolve()),
    remove: mock(() => Promise.resolve()),
  },
};

// @ts-expect-error
global.chrome = {
  storage: mockStorage,
};

describe("StorageManager", () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager();
    mockStorage.local.get.mockClear();
    mockStorage.local.set.mockClear();
    mockStorage.local.remove.mockClear();
  });

  describe("saveCandidate", () => {
    it("должен сохранить данные кандидата с уникальным ключом", async () => {
      const candidateData: CandidateData = {
        platform: "LinkedIn",
        profileUrl: "https://linkedin.com/in/test",
        basicInfo: {
          fullName: "Иван Иванов",
          currentPosition: "Senior Developer",
          location: "Москва",
          photoUrl: "https://example.com/photo.jpg",
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

      await storageManager.saveCandidate(candidateData);

      expect(mockStorage.local.set).toHaveBeenCalledTimes(1);
      const callArgs = mockStorage.local.set.mock.calls[0][0];
      const key = Object.keys(callArgs)[0];
      expect(key).toMatch(/^candidate_\d+$/);
      expect(callArgs[key]).toEqual(candidateData);
    });
  });

  describe("getSettings", () => {
    it("должен вернуть сохраненные настройки", async () => {
      const savedSettings: Settings = {
        apiUrl: "https://api.example.com",
        apiToken: "test-token-123",
        organizationId: "org-123",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: false,
          skills: true,
          contacts: false,
        },
      };

      mockStorage.local.get.mockResolvedValueOnce({ settings: savedSettings });

      const result = await storageManager.getSettings();

      expect(mockStorage.local.get).toHaveBeenCalledWith("settings");
      expect(result).toEqual(savedSettings);
    });

    it("должен вернуть настройки по умолчанию, если настройки не сохранены", async () => {
      mockStorage.local.get.mockResolvedValueOnce({});

      const result = await storageManager.getSettings();

      expect(result).toEqual({
        apiUrl: "",
        apiToken: "",
        organizationId: "",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      });
    });
  });

  describe("saveSettings", () => {
    it("должен сохранить настройки в хранилище", async () => {
      const settings: Settings = {
        apiUrl: "https://api.example.com",
        apiToken: "test-token-123",
        organizationId: "org-123",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      };

      await storageManager.saveSettings(settings);

      expect(mockStorage.local.set).toHaveBeenCalledWith({ settings });
    });
  });

  describe("clearTemporaryData", () => {
    it("должен удалить все ключи с префиксом temp_", async () => {
      const storageData = {
        settings: { apiUrl: "test" },
        candidate_123: {},
        temp_data1: "value1",
        temp_data2: "value2",
        permanent_data: "value3",
      };

      mockStorage.local.get.mockResolvedValueOnce(storageData);

      await storageManager.clearTemporaryData();

      expect(mockStorage.local.get).toHaveBeenCalledWith(null);
      expect(mockStorage.local.remove).toHaveBeenCalledWith([
        "temp_data1",
        "temp_data2",
      ]);
    });

    it("не должен удалять ничего, если нет временных данных", async () => {
      const storageData = {
        settings: { apiUrl: "test" },
        candidate_123: {},
      };

      mockStorage.local.get.mockResolvedValueOnce(storageData);

      await storageManager.clearTemporaryData();

      expect(mockStorage.local.remove).toHaveBeenCalledWith([]);
    });
  });

  describe("getDefaultSettings", () => {
    it("должен вернуть настройки по умолчанию", () => {
      const defaults = storageManager.getDefaultSettings();

      expect(defaults).toEqual({
        apiUrl: "",
        apiToken: "",
        organizationId: "",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      });
    });

    it("должен возвращать новый объект при каждом вызове", () => {
      const defaults1 = storageManager.getDefaultSettings();
      const defaults2 = storageManager.getDefaultSettings();

      expect(defaults1).toEqual(defaults2);
      expect(defaults1).not.toBe(defaults2);
    });
  });
});

// ============================================================================
// Property-based тесты
// ============================================================================

/**
 * Генератор валидных настроек для property-based тестов
 */
function settingsArbitrary(): fc.Arbitrary<Settings> {
  return fc.record({
    apiUrl: fc.webUrl({ validSchemes: ["https"] }),
    apiToken: fc
      .string({ minLength: 10, maxLength: 100 })
      .filter((s) => s.trim().length >= 10),
    organizationId: fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => s.trim().length >= 1),
    fieldsToExtract: fc.record({
      basicInfo: fc.boolean(),
      experience: fc.boolean(),
      education: fc.boolean(),
      skills: fc.boolean(),
      contacts: fc.boolean(),
    }),
  });
}

describe("Property-based тесты для StorageManager", () => {
  let storageManager: StorageManager;
  let actualStorage: Map<string, any>;

  beforeEach(() => {
    storageManager = new StorageManager();
    actualStorage = new Map();

    // Создаем реалистичный mock, который действительно сохраняет данные
    mockStorage.local.get.mockImplementation(
      (keys: string | string[] | null) => {
        if (keys === null) {
          // Возвращаем все данные
          const result: Record<string, any> = {};
          actualStorage.forEach((value, key) => {
            result[key] = value;
          });
          return Promise.resolve(result);
        } else if (typeof keys === "string") {
          // Возвращаем одно значение
          return Promise.resolve({ [keys]: actualStorage.get(keys) });
        } else {
          // Возвращаем несколько значений
          const result: Record<string, any> = {};
          keys.forEach((key) => {
            if (actualStorage.has(key)) {
              result[key] = actualStorage.get(key);
            }
          });
          return Promise.resolve(result);
        }
      },
    );

    mockStorage.local.set.mockImplementation((items: Record<string, any>) => {
      Object.entries(items).forEach(([key, value]) => {
        actualStorage.set(key, value);
      });
      return Promise.resolve();
    });

    mockStorage.local.remove.mockImplementation((keys: string | string[]) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach((key) => {
        actualStorage.delete(key);
      });
      return Promise.resolve();
    });
  });

  /**
   * **Валидирует: Требования 13.4**
   *
   * Свойство 14: Round-trip сохранения настроек
   *
   * Для любых валидных настроек, сохранение настроек в хранилище Chrome
   * и последующее их чтение должно вернуть эквивалентный объект настроек.
   */
  it("Property 14: сохранение и чтение настроек должно вернуть эквивалентный объект", async () => {
    await fc.assert(
      fc.asyncProperty(settingsArbitrary(), async (settings) => {
        // Act
        await storageManager.saveSettings(settings);
        const retrieved = await storageManager.getSettings();

        // Assert
        expect(retrieved).toEqual(settings);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Валидирует: Требования 13.5**
   *
   * Свойство 15: Валидация настроек
   *
   * Для любых настроек API, перед сохранением они должны пройти валидацию
   * через Zod-схему, и только валидные настройки должны быть сохранены.
   */
  it("Property 15: только валидные настройки должны проходить валидацию через Zod", () => {
    fc.assert(
      fc.property(settingsArbitrary(), (settings) => {
        // Act & Assert - валидация не должна выбрасывать ошибку
        const result = SettingsSchema.safeParse(settings);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Валидирует: Требования 13.5**
   *
   * Свойство 15 (дополнительный тест): невалидные настройки должны отклоняться
   */
  it("Property 15: невалидные настройки должны отклоняться валидацией", () => {
    // Тестируем конкретные невалидные случаи
    const invalidCases = [
      // Слишком короткий токен
      {
        apiUrl: "https://api.example.com",
        apiToken: "short",
        organizationId: "org123",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      },
      // Невалидный URL (не URL вообще)
      {
        apiUrl: "not-a-url",
        apiToken: "validtoken123",
        organizationId: "org123",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      },
      // Пустой URL
      {
        apiUrl: "",
        apiToken: "validtoken123",
        organizationId: "org123",
        fieldsToExtract: {
          basicInfo: true,
          experience: true,
          education: true,
          skills: true,
          contacts: true,
        },
      },
    ];

    invalidCases.forEach((settings) => {
      const result = SettingsSchema.safeParse(settings);
      expect(result.success).toBe(false);
    });
  });

  /**
   * **Валидирует: Требования 12.5**
   *
   * Тест для очистки временных данных
   *
   * Для любой сессии работы с расширением, после закрытия панели данных
   * все временные данные (с префиксом temp_) должны быть удалены из хранилища Chrome.
   */
  it("должен очищать все временные данные с префиксом temp_", async () => {
    // Генератор для временных ключей
    const tempKeyArbitrary = fc
      .string({ minLength: 1, maxLength: 20 })
      .map((s) => `temp_${s}`);

    // Генератор для постоянных ключей
    const permanentKeyArbitrary = fc
      .string({ minLength: 1, maxLength: 20 })
      .filter((s) => !s.startsWith("temp_"));

    await fc.assert(
      fc.asyncProperty(
        fc.array(tempKeyArbitrary, { minLength: 1, maxLength: 10 }),
        fc.array(permanentKeyArbitrary, { minLength: 1, maxLength: 10 }),
        fc.string(),
        async (tempKeys, permanentKeys, value) => {
          // Arrange - добавляем временные и постоянные данные
          const allData: Record<string, any> = {};
          tempKeys.forEach((key) => {
            allData[key] = value;
            actualStorage.set(key, value);
          });
          permanentKeys.forEach((key) => {
            allData[key] = value;
            actualStorage.set(key, value);
          });

          // Act - очищаем временные данные
          await storageManager.clearTemporaryData();

          // Assert - временные данные удалены, постоянные остались
          const remainingKeys = Array.from(actualStorage.keys());
          tempKeys.forEach((key) => {
            expect(remainingKeys).not.toContain(key);
          });
          permanentKeys.forEach((key) => {
            expect(remainingKeys).toContain(key);
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Дополнительный тест: проверка идемпотентности очистки временных данных
   */
  it("очистка временных данных должна быть идемпотентной", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.string({ minLength: 1 }).map((s) => `temp_${s}`),
          {
            minLength: 0,
            maxLength: 10,
          },
        ),
        async (tempKeys) => {
          // Arrange
          tempKeys.forEach((key) => {
            actualStorage.set(key, "value");
          });

          // Act - очищаем дважды
          await storageManager.clearTemporaryData();
          const keysAfterFirst = Array.from(actualStorage.keys());
          await storageManager.clearTemporaryData();
          const keysAfterSecond = Array.from(actualStorage.keys());

          // Assert - результат одинаковый
          expect(keysAfterFirst).toEqual(keysAfterSecond);
          expect(keysAfterFirst.filter((k) => k.startsWith("temp_"))).toEqual(
            [],
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
