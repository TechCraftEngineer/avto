import { afterEach, beforeEach, describe, expect, it, vi } from "bun:test";
import fc from "fast-check";
import { Window } from "happy-dom";
import { ErrorHandler } from "./error-handler";
import type { CandidateData } from "./types";

/**
 * Property-based тесты для ErrorHandler
 * Feature: linkedin-parser-extension
 */
describe("ErrorHandler Property-based Tests", () => {
  let errorHandler: ErrorHandler;
  let mockChrome: any;
  let storedData: Map<string, any>;
  let originalChrome: any;

  beforeEach(() => {
    originalChrome = (global as any).chrome;
    errorHandler = new ErrorHandler();
    storedData = new Map();

    // Mock chrome API
    mockChrome = {
      storage: {
        local: {
          set: vi.fn((data: any) => {
            Object.entries(data).forEach(([key, value]) => {
              storedData.set(key, value);
            });
            return Promise.resolve();
          }),
          get: vi.fn((keys: string | string[] | null) => {
            if (keys === null) {
              const result: any = {};
              storedData.forEach((value, key) => {
                result[key] = value;
              });
              return Promise.resolve(result);
            }
            if (typeof keys === "string") {
              return Promise.resolve({ [keys]: storedData.get(keys) });
            }
            const result: any = {};
            keys.forEach((key) => {
              if (storedData.has(key)) {
                result[key] = storedData.get(key);
              }
            });
            return Promise.resolve(result);
          }),
        },
      },
      runtime: {
        openOptionsPage: vi.fn(),
      },
    };
    (global as any).chrome = mockChrome;

    // Mock document
    const mockCreateElement = vi.fn((tag: string) => {
      const element: any = {
        tagName: tag,
        className: "",
        textContent: "",
        onclick: null,
        appendChild: vi.fn(),
        remove: vi.fn(),
        setAttribute: vi.fn(),
      };
      return element;
    });

    (global as any).document = {
      body: {
        appendChild: vi.fn(),
      },
      createElement: mockCreateElement,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    storedData.clear();
    (global as any).chrome = originalChrome;
    // Восстанавливаем document для других тестов (error-handler мокает его)
    const happyWindow = new Window();
    (global as any).document = happyWindow.document;
    (global as any).window = happyWindow;
  });

  /**
   * **Свойство 11: Сохранение частичных данных при ошибке**
   *
   * *Для любого* профиля, если во время извлечения данных происходит ошибка,
   * все успешно извлеченные до момента ошибки данные должны быть сохранены
   * и доступны пользователю.
   *
   * **Валидирует: Требования 11.3**
   */
  describe("Property 11: Сохранение частичных данных при ошибке", () => {
    it("должен сохранять любые непустые частичные данные при ошибке извлечения", () => {
      fc.assert(
        fc.property(partialCandidateDataArbitrary(), (partialData) => {
          // Arrange
          const error = new Error("Ошибка извлечения данных");

          // Act
          errorHandler.handleExtractionError(error, partialData);

          // Assert
          // Проверяем, что данные были сохранены
          expect(mockChrome.storage.local.set).toHaveBeenCalled();

          // Проверяем, что сохраненные данные соответствуют исходным
          const callArgs = mockChrome.storage.local.set.mock.calls[0][0];
          const savedKey = Object.keys(callArgs)[0];
          const savedData = callArgs[savedKey];

          expect(savedKey).toMatch(/^temp_partial_\d+$/);
          expect(savedData).toEqual(partialData);
        }),
        { numRuns: 100 },
      );
    });

    it("должен сохранять частичные данные с любой комбинацией заполненных полей", () => {
      fc.assert(
        fc.property(
          partialCandidateDataWithVariousFieldsArbitrary(),
          (partialData) => {
            // Arrange
            const error = new Error("Ошибка парсинга DOM");

            // Act
            errorHandler.handleExtractionError(error, partialData);

            // Assert
            if (Object.keys(partialData).length > 0) {
              expect(mockChrome.storage.local.set).toHaveBeenCalled();

              const callArgs = mockChrome.storage.local.set.mock.calls[0][0];
              const savedData = Object.values(callArgs)[0];

              // Проверяем, что все поля из partialData присутствуют в сохраненных данных
              Object.keys(partialData).forEach((key) => {
                expect(savedData).toHaveProperty(
                  key,
                  (partialData as any)[key],
                );
              });
            } else {
              // Пустые данные не должны сохраняться
              expect(mockChrome.storage.local.set).not.toHaveBeenCalled();
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("должен сохранять частичные данные независимо от типа ошибки", () => {
      fc.assert(
        fc.property(
          partialCandidateDataArbitrary(),
          fc.string({ minLength: 1, maxLength: 100 }),
          (partialData, errorMessage) => {
            // Arrange
            const error = new Error(errorMessage);

            // Act
            errorHandler.handleExtractionError(error, partialData);

            // Assert
            expect(mockChrome.storage.local.set).toHaveBeenCalled();

            const callArgs = mockChrome.storage.local.set.mock.calls[0][0];
            const savedData = Object.values(callArgs)[0];

            expect(savedData).toEqual(partialData);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("должен генерировать уникальные ключи для каждого сохранения", async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(partialCandidateDataArbitrary(), {
            minLength: 2,
            maxLength: 5,
          }),
          async (partialDataArray) => {
            // Arrange
            const keys = new Set<string>();

            // Act
            for (const partialData of partialDataArray) {
              const error = new Error("Ошибка извлечения");
              errorHandler.handleExtractionError(error, partialData);

              // Небольшая задержка для гарантии уникальности timestamp
              await new Promise((resolve) => setTimeout(resolve, 2));

              // Берём ключи из storedData (мок сохраняет данные при вызове set)
              for (const key of storedData.keys()) {
                if (key.startsWith("temp_partial_")) {
                  keys.add(key);
                }
              }
            }

            // Assert
            // Все ключи должны быть уникальными
            expect(keys.size).toBe(partialDataArray.length);

            // Все ключи должны соответствовать формату temp_partial_{timestamp}
            keys.forEach((key) => {
              expect(key).toMatch(/^temp_partial_\d+$/);
            });
          },
        ),
        { numRuns: 20 },
      );
    });

    it("должен сохранять частичные данные с basicInfo при любых значениях полей", () => {
      fc.assert(
        fc.property(
          fc.record({
            platform: fc.constantFrom("LinkedIn", "HeadHunter"),
            basicInfo: fc.record({
              fullName: fc
                .string({ minLength: 3, maxLength: 100 })
                .filter((s) => s.trim().length > 0), // Только непустые строки
              currentPosition: fc.string({ maxLength: 200 }),
              location: fc.string({ maxLength: 100 }),
              photoUrl: fc.option(fc.webUrl(), { nil: null }),
            }),
          }),
          (partialData) => {
            // Arrange
            const error = new Error("Ошибка извлечения");

            // Act
            errorHandler.handleExtractionError(error, partialData);

            // Assert
            expect(mockChrome.storage.local.set).toHaveBeenCalled();

            const callArgs = mockChrome.storage.local.set.mock.calls[0][0];
            const savedData = Object.values(callArgs)[0] as any;

            expect(savedData.platform).toBe(partialData.platform);
            expect(savedData.basicInfo).toEqual(partialData.basicInfo);
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});

/**
 * Генератор для частичных данных кандидата (непустых)
 */
function partialCandidateDataArbitrary(): fc.Arbitrary<Partial<CandidateData>> {
  return fc
    .record(
      {
        platform: fc.option(fc.constantFrom("LinkedIn", "HeadHunter")),
        profileUrl: fc.option(fc.webUrl()),
        basicInfo: fc.option(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 100 }),
            currentPosition: fc.string({ maxLength: 200 }),
            location: fc.string({ maxLength: 100 }),
            photoUrl: fc.option(fc.webUrl(), { nil: null }),
          }),
        ),
        experience: fc.option(
          fc.array(
            fc.record({
              position: fc.string({ minLength: 1, maxLength: 100 }),
              company: fc.string({ minLength: 1, maxLength: 100 }),
              startDate: fc.string({ minLength: 1, maxLength: 50 }),
              endDate: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
              description: fc.string({ maxLength: 500 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
        ),
        education: fc.option(
          fc.array(
            fc.record({
              institution: fc.string({ minLength: 1, maxLength: 100 }),
              degree: fc.string({ maxLength: 100 }),
              fieldOfStudy: fc.string({ maxLength: 100 }),
              startDate: fc.string({ maxLength: 50 }),
              endDate: fc.string({ maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
        ),
        skills: fc.option(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
            minLength: 1,
            maxLength: 20,
          }),
        ),
        contacts: fc.option(
          fc.record({
            email: fc.option(fc.emailAddress(), { nil: null }),
            phone: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
            socialLinks: fc.array(fc.webUrl(), { maxLength: 5 }),
          }),
        ),
      },
      { requiredKeys: [] },
    )
    .map((data) => {
      // Удаляем поля с null/undefined значениями
      const filtered: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          filtered[key] = value;
        }
      }
      return filtered;
    })
    .filter((data) => Object.keys(data).length > 0); // Гарантируем непустые данные
}

/**
 * Генератор для частичных данных с различными комбинациями полей
 */
function partialCandidateDataWithVariousFieldsArbitrary(): fc.Arbitrary<
  Partial<CandidateData>
> {
  return fc.oneof(
    // Только platform
    fc.record({
      platform: fc.constantFrom("LinkedIn", "HeadHunter"),
    }),
    // Только basicInfo
    fc.record({
      basicInfo: fc.record({
        fullName: fc.string({ minLength: 1, maxLength: 100 }),
        currentPosition: fc.string({ maxLength: 200 }),
        location: fc.string({ maxLength: 100 }),
        photoUrl: fc.option(fc.webUrl(), { nil: null }),
      }),
    }),
    // platform + basicInfo
    fc.record({
      platform: fc.constantFrom("LinkedIn", "HeadHunter"),
      basicInfo: fc.record({
        fullName: fc.string({ minLength: 1, maxLength: 100 }),
        currentPosition: fc.string({ maxLength: 200 }),
        location: fc.string({ maxLength: 100 }),
        photoUrl: fc.option(fc.webUrl(), { nil: null }),
      }),
    }),
    // platform + basicInfo + experience
    fc.record({
      platform: fc.constantFrom("LinkedIn", "HeadHunter"),
      basicInfo: fc.record({
        fullName: fc.string({ minLength: 1, maxLength: 100 }),
        currentPosition: fc.string({ maxLength: 200 }),
        location: fc.string({ maxLength: 100 }),
        photoUrl: fc.option(fc.webUrl(), { nil: null }),
      }),
      experience: fc.array(
        fc.record({
          position: fc.string({ minLength: 1, maxLength: 100 }),
          company: fc.string({ minLength: 1, maxLength: 100 }),
          startDate: fc.string({ minLength: 1, maxLength: 50 }),
          endDate: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
          description: fc.string({ maxLength: 500 }),
        }),
        { minLength: 1, maxLength: 3 },
      ),
    }),
    // Все поля кроме contacts
    fc.record({
      platform: fc.constantFrom("LinkedIn", "HeadHunter"),
      profileUrl: fc.webUrl(),
      basicInfo: fc.record({
        fullName: fc.string({ minLength: 1, maxLength: 100 }),
        currentPosition: fc.string({ maxLength: 200 }),
        location: fc.string({ maxLength: 100 }),
        photoUrl: fc.option(fc.webUrl(), { nil: null }),
      }),
      experience: fc.array(
        fc.record({
          position: fc.string({ minLength: 1, maxLength: 100 }),
          company: fc.string({ minLength: 1, maxLength: 100 }),
          startDate: fc.string({ minLength: 1, maxLength: 50 }),
          endDate: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
          description: fc.string({ maxLength: 500 }),
        }),
        { maxLength: 2 },
      ),
      education: fc.array(
        fc.record({
          institution: fc.string({ minLength: 1, maxLength: 100 }),
          degree: fc.string({ maxLength: 100 }),
          fieldOfStudy: fc.string({ maxLength: 100 }),
          startDate: fc.string({ maxLength: 50 }),
          endDate: fc.string({ maxLength: 50 }),
        }),
        { maxLength: 2 },
      ),
      skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
        maxLength: 10,
      }),
    }),
    // Пустой объект
    fc.constant({}),
  );
}
