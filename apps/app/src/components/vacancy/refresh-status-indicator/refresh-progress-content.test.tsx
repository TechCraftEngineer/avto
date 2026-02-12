import { describe, expect, it } from "bun:test";
import { render, within } from "@testing-library/react";
import { RefreshProgressContent } from "./refresh-progress-content";

describe("RefreshProgressContent", () => {
  it("должен отображать message", () => {
    const { container } = render(
      <RefreshProgressContent
        progress={{
          vacancyId: "v1",
          status: "processing",
          message: "Получаем отклики",
        }}
      />,
    );

    expect(within(container).getByText("Получаем отклики")).toBeDefined();
  });

  it("должен отображать данные прогресса для статуса processing с currentPage", () => {
    const { container } = render(
      <RefreshProgressContent
        progress={{
          vacancyId: "v1",
          status: "processing",
          message: "Получаем отклики",
          currentPage: 2,
          totalSaved: 25,
          totalSkipped: 5,
        }}
      />,
    );

    const w = within(container);
    expect(w.getByText("Новых: 25")).toBeDefined();
    expect(w.getByText("Пропущено: 5")).toBeDefined();
  });

  it("должен отображать 0 для missing totalSaved и totalSkipped", () => {
    const { container } = render(
      <RefreshProgressContent
        progress={{
          vacancyId: "v1",
          status: "processing",
          message: "Получаем отклики",
          currentPage: 1,
        }}
      />,
    );

    const w = within(container);
    expect(w.getByText("Новых: 0")).toBeDefined();
    expect(w.getByText("Пропущено: 0")).toBeDefined();
  });

  it("не должен отображать прогресс бар для статуса processing без currentPage", () => {
    const { container } = render(
      <RefreshProgressContent
        progress={{
          vacancyId: "v1",
          status: "processing",
          message: "Ожидание",
        }}
      />,
    );

    // Должен отображаться только message без прогресс бара
    const w = within(container);
    expect(w.getByText("Ожидание")).toBeDefined();
    expect(w.queryByText("Новых:")).toBeNull();
  });

  it("должен отображать ошибку для статуса error", () => {
    const { container } = render(
      <RefreshProgressContent
        progress={{
          vacancyId: "v1",
          status: "error",
          message: "Не удалось получить отклики",
        }}
      />,
    );

    // Проверяем наличие элемента с ошибкой
    const errorElement = container.querySelector(".text-destructive");
    expect(errorElement).toBeDefined();
  });

  it("должен отображать сообщение об ошибке с классом text-destructive", () => {
    const { container } = render(
      <RefreshProgressContent
        progress={{
          vacancyId: "v1",
          status: "error",
          message: "Ошибка",
        }}
      />,
    );

    const errorElement = container.querySelector(".text-destructive");
    expect(errorElement).toBeDefined();
  });

  it("не должен отобразывать блок с прогрессом для статуса started", () => {
    const { container } = render(
      <RefreshProgressContent
        progress={{
          vacancyId: "v1",
          status: "started",
          message: "Задание в очереди",
        }}
      />,
    );

    const w = within(container);
    expect(w.getByText("Задание в очереди")).toBeDefined();
    expect(w.queryByText("Новых:")).toBeNull();
  });

  it("не должен отобразывать блок с прогрессом для статуса completed", () => {
    const { container } = render(
      <RefreshProgressContent
        progress={{
          vacancyId: "v1",
          status: "completed",
          message: "Готово",
        }}
      />,
    );

    const w = within(container);
    expect(w.getByText("Готово")).toBeDefined();
    expect(w.queryByText("Новых:")).toBeNull();
  });
});
