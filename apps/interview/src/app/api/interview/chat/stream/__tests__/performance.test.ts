/**
 * Performance тесты для системы разделения потоков интервью
 * Проверяет соответствие метрикам успеха:
 * - Создание стратегии < 10ms
 * - Создание инструментов < 50ms
 * - Построение промпта < 5ms
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { InterviewStrategyFactory } from "../strategies";
import type { SupportedEntityType } from "../strategies/types";

describe("Performance Tests", () => {
  let strategyFactory: InterviewStrategyFactory;

  beforeEach(() => {
    strategyFactory = new InterviewStrategyFactory();
  });

  describe("Создание стратегии", () => {
    it("должно занимать < 10ms для gig стратегии", () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const strategy = strategyFactory.create("gig");
        const end = performance.now();

        times.push(end - start);
        expect(strategy.entityType).toBe("gig");
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`\n📊 Создание gig стратегии:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Минимум: ${minTime.toFixed(3)}ms`);
      console.log(`   Максимум: ${maxTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 10ms`);

      expect(avgTime).toBeLessThan(10);
      expect(maxTime).toBeLessThan(25); // Допускаем выбросы до 25ms (первый запуск может быть медленнее)
    });

    it("должно занимать < 10ms для vacancy стратегии", () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const strategy = strategyFactory.create("vacancy");
        const end = performance.now();

        times.push(end - start);
        expect(strategy.entityType).toBe("vacancy");
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`\n📊 Создание vacancy стратегии:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Минимум: ${minTime.toFixed(3)}ms`);
      console.log(`   Максимум: ${maxTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 10ms`);

      expect(avgTime).toBeLessThan(10);
      expect(maxTime).toBeLessThan(20);
    });

    it("должно эффективно обрабатывать неизвестные типы (fallback)", () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const strategy = strategyFactory.create(
          "unknown" as SupportedEntityType,
        );
        const end = performance.now();

        times.push(end - start);
        expect(strategy.entityType).toBe("vacancy"); // Fallback на vacancy
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`\n📊 Fallback на vacancy:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 10ms`);

      expect(avgTime).toBeLessThan(10);
    });
  });

  describe("Построение промпта", () => {
    it("должно занимать < 5ms для gig промпта", () => {
      const strategy = strategyFactory.create("gig");
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const prompt = strategy.systemPromptBuilder.build(false, "org");
        const end = performance.now();

        times.push(end - start);
        expect(prompt).toBeTruthy();
        expect(typeof prompt).toBe("string");
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`\n📊 Построение gig промпта:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Максимум: ${maxTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 5ms`);

      expect(avgTime).toBeLessThan(5);
      expect(maxTime).toBeLessThan(10);
    });

    it("должно занимать < 5ms для vacancy промпта", () => {
      const strategy = strategyFactory.create("vacancy");
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const prompt = strategy.systemPromptBuilder.build(false, "tech");
        const end = performance.now();

        times.push(end - start);
        expect(prompt).toBeTruthy();
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`\n📊 Построение vacancy промпта:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Максимум: ${maxTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 5ms`);

      expect(avgTime).toBeLessThan(5);
      expect(maxTime).toBeLessThan(10);
    });

    it("должно эффективно строить промпт для первого ответа", () => {
      const strategy = strategyFactory.create("gig");
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const prompt = strategy.systemPromptBuilder.build(true, "intro");
        const end = performance.now();

        times.push(end - start);
        expect(prompt).toContain("первый"); // Должен содержать инструкции для первого ответа
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`\n📊 Построение промпта для первого ответа:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 5ms`);

      expect(avgTime).toBeLessThan(5);
    });
  });

  describe("Проверка переходов между стадиями", () => {
    it("должно быстро проверять возможность перехода", () => {
      const strategy = strategyFactory.create("gig");
      const iterations = 1000;
      const times: number[] = [];

      const context = {
        askedQuestions: ["q1", "q2", "q3"],
        userResponses: ["r1", "r2", "r3"],
        botDetectionScore: 0,
        timeInCurrentStage: 60,
      };

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const canTransition = strategy.canTransition("org", "tech", context);
        const end = performance.now();

        times.push(end - start);
        expect(typeof canTransition).toBe("boolean");
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`\n📊 Проверка перехода между стадиями:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Максимум: ${maxTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 1ms`);

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe("Получение следующего вопроса", () => {
    it("должно быстро находить следующий вопрос", () => {
      const strategy = strategyFactory.create("vacancy");
      const iterations = 1000;
      const times: number[] = [];

      const questionBank = {
        organizational: [
          "Вопрос 1",
          "Вопрос 2",
          "Вопрос 3",
          "Вопрос 4",
          "Вопрос 5",
        ],
        technical: ["Технический вопрос 1", "Технический вопрос 2"],
        asked: [],
      };

      const interviewState = {
        stage: "org",
        askedQuestions: ["Вопрос 1", "Вопрос 2"],
        voiceOptionOffered: false,
        questionCount: 2,
      };

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const nextQuestion = strategy.getNextQuestion(
          questionBank,
          interviewState,
        );
        const end = performance.now();

        times.push(end - start);
        expect(nextQuestion).toBe("Вопрос 3");
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`\n📊 Получение следующего вопроса:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Максимум: ${maxTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 1ms`);

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe("Получение конфигурации UI", () => {
    it("должно быстро получать welcome message", () => {
      const strategy = strategyFactory.create("gig");
      const iterations = 1000;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const welcomeMessage = strategy.getWelcomeMessage();
        const end = performance.now();

        times.push(end - start);
        expect(welcomeMessage.title).toBeTruthy();
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`\n📊 Получение welcome message:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 1ms`);

      expect(avgTime).toBeLessThan(1);
    });

    it("должно быстро получать context card data", () => {
      const strategy = strategyFactory.create("vacancy");
      const iterations = 1000;
      const times: number[] = [];

      const mockEntity = {
        id: "test-id",
        title: "Test Vacancy",
        description: "Test description",
        __brand: "vacancy" as const,
      };

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const contextCard = strategy.getContextCardData(mockEntity);
        const end = performance.now();

        times.push(end - start);
        expect(contextCard.badgeLabel).toBeTruthy();
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`\n📊 Получение context card data:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 1ms`);

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe("Создание схемы оценки", () => {
    it("должно быстро создавать Zod схему", () => {
      const strategy = strategyFactory.create("gig");
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const schema = strategy.createScoringSchema();
        const end = performance.now();

        times.push(end - start);
        expect(schema).toBeTruthy();
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`\n📊 Создание схемы оценки:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 1ms`);

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe("Регистрация новой стратегии", () => {
    it("должно быстро регистрировать и проверять стратегию", () => {
      const iterations = 1000;
      const times: number[] = [];

      class TestStrategy {
        entityType = "test" as const;
      }

      for (let i = 0; i < iterations; i++) {
        const factory = new InterviewStrategyFactory();

        const start = performance.now();
        factory.register(
          "test" as SupportedEntityType,
          () => new TestStrategy() as any,
        );
        const isSupported = factory.isSupported("test");
        const end = performance.now();

        times.push(end - start);
        expect(isSupported).toBe(true);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(`\n📊 Регистрация новой стратегии:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 1ms`);

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe("Общая производительность системы", () => {
    it("должно эффективно выполнять полный цикл создания стратегии и получения данных", () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();

        // Полный цикл работы со стратегией
        const strategy = strategyFactory.create("gig");
        const prompt = strategy.systemPromptBuilder.build(false, "org");
        const welcomeMessage = strategy.getWelcomeMessage();
        const schema = strategy.createScoringSchema();
        const canTransition = strategy.canTransition("intro", "org", {
          askedQuestions: ["q1"],
          userResponses: ["r1"],
        });

        const end = performance.now();

        times.push(end - start);
        expect(strategy).toBeTruthy();
        expect(prompt).toBeTruthy();
        expect(welcomeMessage).toBeTruthy();
        expect(schema).toBeTruthy();
        expect(typeof canTransition).toBe("boolean");
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`\n📊 Полный цикл работы со стратегией:`);
      console.log(`   Среднее: ${avgTime.toFixed(3)}ms`);
      console.log(`   Максимум: ${maxTime.toFixed(3)}ms`);
      console.log(`   Целевое значение: < 20ms`);

      expect(avgTime).toBeLessThan(20);
    });
  });
});
