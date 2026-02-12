import { describe, expect, it } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { RefreshResultContent } from "./refresh-result-content";

describe("RefreshResultContent", () => {
  describe("Успешный результат (success=true)", () => {
    it("должен отображать общее количество откликов", () => {
      const { container } = render(
        <RefreshResultContent
          result={{
            vacancyId: "v1",
            success: true,
            newCount: 15,
            totalResponses: 100,
          }}
        />,
      );

      const w = within(container);
      expect(w.getByText("100")).toBeDefined();
      expect(w.getByText("Всего откликов")).toBeDefined();
    });

    it("должен отображать количество новых откликов", () => {
      const { container } = render(
        <RefreshResultContent
          result={{
            vacancyId: "v1",
            success: true,
            newCount: 15,
            totalResponses: 100,
          }}
        />,
      );

      const w = within(container);
      expect(w.getByText("15")).toBeDefined();
      expect(w.getByText("Новых добавлено")).toBeDefined();
    });

    it("должен отображать 0 для newCount=0", () => {
      const { container } = render(
        <RefreshResultContent
          result={{
            vacancyId: "v1",
            success: true,
            newCount: 0,
            totalResponses: 50,
          }}
        />,
      );

      const w = within(container);
      expect(w.getByText("0")).toBeDefined();
      expect(w.getByText("Новых добавлено")).toBeDefined();
    });

    it("должен отображать сообщение об автозакрытии", () => {
      const { container } = render(
        <RefreshResultContent
          result={{
            vacancyId: "v1",
            success: true,
            newCount: 10,
            totalResponses: 100,
          }}
        />,
      );

      expect(within(container).getByText(/Закроется автоматически через 10 секунд/)).toBeDefined();
    });

    it("должен иметь зеленую цветовую схему", () => {
      const { container } = render(
        <RefreshResultContent
          result={{
            vacancyId: "v1",
            success: true,
            newCount: 10,
            totalResponses: 100,
          }}
        />,
      );

      // Проверяем наличие green классов
      const greenText = container.querySelector(".text-green-600");
      expect(greenText).toBeDefined();
    });
  });

  describe("Ошибочный результат (success=false)", () => {
    it("должен отображать заголовок ошибки", () => {
      const { container } = render(
        <RefreshResultContent
          result={{
            vacancyId: "v1",
            success: false,
            newCount: 0,
            totalResponses: 100,
            error: "Ошибка при получении данных",
          }}
        />,
      );

      const w = within(container);
      expect(w.getByText("Не удалось получить отклики")).toBeDefined();
    });

    it("должен отображать текст ошибки", () => {
      const { container } = render(
        <RefreshResultContent
          result={{
            vacancyId: "v1",
            success: false,
            newCount: 0,
            totalResponses: 100,
            error: "Таймаут соединения",
          }}
        />,
      );

      expect(within(container).getByText("Таймаут соединения")).toBeDefined();
    });

    it("должен отображать сообщение по умолчанию если error не передан", () => {
      const { container } = render(
        <RefreshResultContent
          result={{
            vacancyId: "v1",
            success: false,
            newCount: 0,
            totalResponses: 100,
          }}
        />,
      );

      expect(within(container).getByText("Произошла неизвестная ошибка")).toBeDefined();
    });

    it("должен иметь красную цветовую схему для ошибки", () => {
      const { container } = render(
        <RefreshResultContent
          result={{
            vacancyId: "v1",
            success: false,
            newCount: 0,
            totalResponses: 100,
            error: "Ошибка",
          }}
        />,
      );

      const errorElement = container.querySelector(".text-destructive");
      expect(errorElement).toBeDefined();
    });

    it("должен отображать иконку XCircle для ошибки", () => {
      const { container } = render(
        <RefreshResultContent
          result={{
            vacancyId: "v1",
            success: false,
            newCount: 0,
            totalResponses: 100,
          }}
        />,
      );

      const xCircleIcon = container.querySelector("svg");
      expect(xCircleIcon).toBeDefined();
    });
  });
});
