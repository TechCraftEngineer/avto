import { describe, expect, it } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { ArchivedStatusContent } from "./archived-status-content";

describe("ArchivedStatusContent", () => {
  it("должен отображать message", () => {
    const { container } = render(
      <ArchivedStatusContent
        status={{
          status: "processing",
          message: "Загрузка откликов...",
          vacancyId: "v1",
        }}
      />,
    );

    expect(within(container).getByText("Загрузка откликов...")).toBeDefined();
  });

  it("должен отображать syncedResponses и newResponses", () => {
    const { container } = render(
      <ArchivedStatusContent
        status={{
          status: "processing",
          message: "Обработка",
          vacancyId: "v1",
          syncedResponses: 25,
          newResponses: 8,
        }}
      />,
    );

    const w = within(container);
    expect(w.getByText("25")).toBeDefined();
    expect(w.getByText("8")).toBeDefined();
    expect(w.getByText("Обработано")).toBeDefined();
    expect(w.getByText("Новых добавлено")).toBeDefined();
  });

  it("должен отображать сообщение для статуса processing", () => {
    const { container } = render(
      <ArchivedStatusContent
        status={{
          status: "processing",
          message: "Получаем данные",
          vacancyId: "v1",
        }}
      />,
    );

    expect(
      within(container).getByText(/Получаем данные с HeadHunter/i),
    ).toBeDefined();
  });

  it("должен отображать сообщение для статуса completed", () => {
    const { container } = render(
      <ArchivedStatusContent
        status={{
          status: "completed",
          message: "Готово",
          vacancyId: "v1",
          syncedResponses: 10,
          newResponses: 2,
        }}
      />,
    );

    expect(
      within(container).getByText(/Закроется автоматически через 3 секунды/i),
    ).toBeDefined();
  });

  it("должен отображать сообщение об ошибке при status=error", () => {
    const { container } = render(
      <ArchivedStatusContent
        status={{
          status: "error",
          message: "Не удалось загрузить отклики",
          vacancyId: "v1",
        }}
      />,
    );

    const errorElements = within(container).getAllByText(
      "Не удалось загрузить отклики",
    );
    expect(errorElements.length).toBeGreaterThanOrEqual(1);
  });
});
