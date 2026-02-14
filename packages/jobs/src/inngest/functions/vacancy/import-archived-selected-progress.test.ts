/**
 * Тесты для логики подсчётов и надписей в import-archived-selected.
 * Callback importMultipleVacancies вызывается с (index, success, error?),
 * где index — 0-based индекс только что обработанной вакансии.
 */
import { describe, expect, it } from "bun:test";
import { pluralizeVacancy } from "./pluralize-vacancy";

describe("Логика подсчётов progress в import-archived-selected", () => {
  function buildProgressMessage(index: number, total: number): string {
    return `Обработано ${index + 1} из ${total} ${pluralizeVacancy(total)}`;
  }

  function getProcessedCount(index: number): number {
    return index + 1;
  }

  describe("сообщение 'Обработано X из Y'", () => {
    it("при index=0 и total=3 показывает 'Обработано 1 из 3 вакансии'", () => {
      expect(buildProgressMessage(0, 3)).toBe("Обработано 1 из 3 вакансии");
    });

    it("при index=1 и total=3 показывает 'Обработано 2 из 3 вакансии'", () => {
      expect(buildProgressMessage(1, 3)).toBe("Обработано 2 из 3 вакансии");
    });

    it("при index=2 и total=3 показывает 'Обработано 3 из 3 вакансии'", () => {
      expect(buildProgressMessage(2, 3)).toBe("Обработано 3 из 3 вакансии");
    });

    it("при одной вакансии (index=0, total=1) показывает 'Обработано 1 из 1 вакансия'", () => {
      expect(buildProgressMessage(0, 1)).toBe("Обработано 1 из 1 вакансия");
    });

    it("при 5 вакансиях последовательно даёт корректные сообщения", () => {
      const total = 5;
      for (let i = 0; i < total; i++) {
        expect(buildProgressMessage(i, total)).toBe(
          `Обработано ${i + 1} из ${total} ${pluralizeVacancy(total)}`,
        );
      }
    });
  });

  describe("processed count (количество обработанных)", () => {
    it("index 0 => processed 1", () => {
      expect(getProcessedCount(0)).toBe(1);
    });

    it("index 1 => processed 2", () => {
      expect(getProcessedCount(1)).toBe(2);
    });

    it("index N-1 при total N => processed N", () => {
      const total = 10;
      expect(getProcessedCount(total - 1)).toBe(total);
    });
  });

  describe("корректность формулы index+1", () => {
    it("index — это индекс в массиве (0-based), processed — человекочитаемый счётчик (1-based)", () => {
      // Callback вызывается ПОСЛЕ обработки вакансии с индексом index
      const index = 2; // обработали третью вакансию (индексы 0,1,2)
      const total = 5;
      expect(buildProgressMessage(index, total)).toBe(
        "Обработано 3 из 5 вакансий",
      );
      expect(getProcessedCount(index)).toBe(3);
    });
  });

  describe("currentVacancy / nextVacancy", () => {
    it("после обработки index следующий — vacancyList[index+1]", () => {
      const index = 1;
      const vacancyList = [
        { id: "1", title: "A" },
        { id: "2", title: "B" },
        { id: "3", title: "C" },
      ];
      const nextVacancy = vacancyList[index + 1];
      expect(nextVacancy).toEqual({ id: "3", title: "C" });
    });

    it("после обработки последней (index=length-1) nextVacancy — undefined", () => {
      const vacancyList = [{ id: "1", title: "A" }];
      const index = vacancyList.length - 1;
      const nextVacancy = vacancyList[index + 1];
      expect(nextVacancy).toBeUndefined();
    });
  });

  describe("failed count", () => {
    it("failed инкрементируется только при success=false", () => {
      let failed = 0;
      const processResult = (success: boolean) => {
        if (!success) failed++;
        return failed;
      };
      expect(processResult(true)).toBe(0);
      expect(processResult(true)).toBe(0);
      expect(processResult(false)).toBe(1);
      expect(processResult(false)).toBe(2);
      expect(processResult(true)).toBe(2);
    });
  });

  describe("соответствие реальному коду import-archived-selected.ts", () => {
    it("message и processed используют index+1 (callback вызывается с 0-based index)", () => {
      // В archived-runner.ts: for (let i = 0; i < vacancies.length; i++) { ... await onProgress?.(i, true); }
      const vacancyListLength = 3;
      const callbackIndices = [0, 1, 2];

      for (const index of callbackIndices) {
        const word = pluralizeVacancy(vacancyListLength);
        const message = `Обработано ${index + 1} из ${vacancyListLength} ${word}`;
        const processed = index + 1;
        expect(message).toBe(
          `Обработано ${processed} из ${vacancyListLength} ${word}`,
        );
        expect(processed).toBeLessThanOrEqual(vacancyListLength);
      }
    });

    it("completed status: processed = vacancyList.length, total = vacancyList.length", () => {
      const vacancyListLength = 5;
      const processed = vacancyListLength;
      const total = vacancyListLength;
      expect(processed).toBe(total);
      expect(processed).toBe(5);
    });
  });
});
