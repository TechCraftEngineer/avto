import { describe, expect, it } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { AnalyzeProgressContent } from "./analyze-progress-content";

describe("AnalyzeProgressContent", () => {
  it("должен возвращать null когда нет progress и completed", () => {
    const { container } = render(<AnalyzeProgressContent progress={null} completed={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("должен отображать completed данные с правильным текстом", () => {
    const { container } = render(
      <AnalyzeProgressContent
        progress={null}
        completed={{
          vacancyId: "v1",
          total: 100,
          processed: 95,
          failed: 5,
        }}
      />,
    );

    const w = within(container);
    expect(w.getByText(/Проанализировано откликов: 95 из 100/)).toBeDefined();
    expect(w.getByText(/Ошибок: 5/)).toBeDefined();
  });

  it("должен отображать completed данные без ошибок когда failed=0", () => {
    const { container } = render(
      <AnalyzeProgressContent
        progress={null}
        completed={{
          vacancyId: "v1",
          total: 50,
          processed: 50,
          failed: 0,
        }}
      />,
    );

    const w = within(container);
    expect(w.getByText(/Проанализировано откликов: 50 из 50/)).toBeDefined();
    // Не должно быть элемента с "Ошибок: 0"
    const errorElements = w.queryAllByText(/Ошибок: 0/);
    expect(errorElements.length).toBe(0);
  });

  it("должен отображать progress данные с прогресс баром", () => {
    const { container } = render(
      <AnalyzeProgressContent
        progress={{
          vacancyId: "v1",
          total: 100,
          processed: 50,
          failed: 2,
        }}
        completed={null}
      />,
    );

    const w = within(container);
    expect(w.getByText(/Обработано: 50 из 100/)).toBeDefined();
    expect(w.getByText(/Успешно: 48/)).toBeDefined();
    expect(w.getByText(/Ошибок: 2/)).toBeDefined();

    // Проверяем что есть прогресс бар
    const progressBar = container.querySelector(".bg-primary");
    expect(progressBar).toBeDefined();
  });

  it("должен отображать progress данные без ошибок когда failed=0", () => {
    const { container } = render(
      <AnalyzeProgressContent
        progress={{
          vacancyId: "v1",
          total: 100,
          processed: 25,
          failed: 0,
        }}
        completed={null}
      />,
    );

    const w = within(container);
    expect(w.getByText(/Обработано: 25 из 100/)).toBeDefined();
    expect(w.getByText(/Успешно: 25/)).toBeDefined();
    // Не должно быть элемента с "Ошибок: 0"
    const errorElements = w.queryAllByText(/Ошибок: 0/);
    expect(errorElements.length).toBe(0);
  });

  it("должен вычислять правильный процент прогресса", () => {
    const { container } = render(
      <AnalyzeProgressContent
        progress={{
          vacancyId: "v1",
          total: 80,
          processed: 20,
          failed: 0,
        }}
        completed={null}
      />,
    );

    // При 20 из 80 должно быть 25%
    const progressBar = container.querySelector(".bg-primary") as HTMLElement;
    expect(progressBar.style.width).toBe("25%");
  });

  it("должен показывать только completed когда оба значения переданы", () => {
    const { container } = render(
      <AnalyzeProgressContent
        progress={{
          vacancyId: "v1",
          total: 100,
          processed: 50,
          failed: 2,
        }}
        completed={{
          vacancyId: "v1",
          total: 100,
          processed: 100,
          failed: 3,
        }}
      />,
    );

    // Должен показывать completed, не progress
    const w = within(container);
    expect(w.getByText(/Проанализировано откликов: 100 из 100/)).toBeDefined();
    expect(w.queryByText(/Обработано: 50 из 100/)).toBeNull();
  });
});
