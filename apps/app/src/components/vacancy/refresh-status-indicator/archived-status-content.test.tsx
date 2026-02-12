import { describe, expect, it } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { ArchivedStatusContent } from "./archived-status-content";

describe("ArchivedStatusContent", () => {
  it("должен отображать message", () => {
    render(
      <ArchivedStatusContent
        status={{
          status: "processing",
          message: "Загрузка откликов...",
          vacancyId: "v1",
        }}
      />,
    );

    expect(screen.getByText("Загрузка откликов...")).toBeDefined();
  });

  it("должен отображать syncedResponses и newResponses", () => {
    render(
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

    expect(screen.getByText("25")).toBeDefined();
    expect(screen.getByText("8")).toBeDefined();
    expect(screen.getByText("Обработано")).toBeDefined();
    expect(screen.getByText("Новых добавлено")).toBeDefined();
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
    render(
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

    expect(screen.getByText(/Закроется автоматически через 3 секунды/i)).toBeDefined();
  });

  it("должен отображать сообщение об ошибке при status=error", () => {
    render(
      <ArchivedStatusContent
        status={{
          status: "error",
          message: "Не удалось загрузить отклики",
          vacancyId: "v1",
        }}
      />,
    );

    const errorElements = screen.getAllByText("Не удалось загрузить отклики");
    expect(errorElements.length).toBeGreaterThanOrEqual(1);
  });
});
