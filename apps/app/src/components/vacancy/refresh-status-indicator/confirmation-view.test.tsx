import { beforeEach, describe, expect, it, vi } from "bun:test";
import { render, fireEvent } from "@testing-library/react";
import { ConfirmationView } from "./confirmation-view";

describe("ConfirmationView", () => {
  const defaultProps = {
    mode: "refresh" as const,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен отображать заголовок для режима refresh", () => {
    const { container } = render(<ConfirmationView {...defaultProps} />);
    const title = container.querySelector("h4");
    expect(title?.textContent).toBe("Получение новых откликов");
  });

  it("должен отображать заголовок для режима archived", () => {
    const { container } = render(<ConfirmationView {...defaultProps} mode="archived" />);
    const title = container.querySelector("h4");
    expect(title?.textContent).toBe("Синхронизация архивных откликов");
  });

  it("должен отображать заголовок для режима analyze", () => {
    const { container } = render(<ConfirmationView {...defaultProps} mode="analyze" />);
    const title = container.querySelector("h4");
    expect(title?.textContent).toBe("Анализ откликов");
  });

  it("должен отображать заголовок для режима screening", () => {
    const { container } = render(<ConfirmationView {...defaultProps} mode="screening" />);
    const title = container.querySelector("h4");
    expect(title?.textContent).toBe("Скрининг новых откликов");
  });

  it("должен отображать описание", () => {
    const { container } = render(<ConfirmationView {...defaultProps} />);
    const description = container.querySelector(".text-muted-foreground.mb-3");
    expect(description?.textContent?.includes("Получение новых откликов с HeadHunter")).toBe(true);
  });

  it("должен отображать список действий", () => {
    const { container } = render(<ConfirmationView {...defaultProps} />);
    const listHeader = container.querySelector(".font-medium");
    expect(listHeader?.textContent).toBe("Что будет происходить:");
  });

  it("должен отображать кнопку Отмена", () => {
    const { container } = render(<ConfirmationView {...defaultProps} />);
    const buttons = container.querySelectorAll("button");
    const cancelButton = Array.from(buttons).find(b => b.textContent === "Отмена");
    expect(cancelButton).toBeDefined();
  });

  it("должен отображать кнопку подтверждения для режима refresh", () => {
    const { container } = render(<ConfirmationView {...defaultProps} mode="refresh" />);
    const buttons = container.querySelectorAll("button");
    const confirmButton = Array.from(buttons).find(b => b.textContent?.includes("Получить отклики"));
    expect(confirmButton).toBeDefined();
  });

  it("должен отображать кнопку подтверждения для режима archived", () => {
    const { container } = render(<ConfirmationView {...defaultProps} mode="archived" />);
    const buttons = container.querySelectorAll("button");
    const confirmButton = Array.from(buttons).find(b => b.textContent?.includes("Начать синхронизацию"));
    expect(confirmButton).toBeDefined();
  });

  it("должен отображать кнопку подтверждения для режима analyze", () => {
    const { container } = render(<ConfirmationView {...defaultProps} mode="analyze" />);
    const buttons = container.querySelectorAll("button");
    const confirmButton = Array.from(buttons).find(b => b.textContent?.includes("Начать анализ"));
    expect(confirmButton).toBeDefined();
  });

  it("должен отображать кнопку подтверждения для режима screening", () => {
    const { container } = render(<ConfirmationView {...defaultProps} mode="screening" />);
    const buttons = container.querySelectorAll("button");
    const confirmButton = Array.from(buttons).find(b => b.textContent?.includes("Начать скрининг"));
    expect(confirmButton).toBeDefined();
  });

  it("должен вызывать onClose при клике на кнопку Отмена", () => {
    const { container } = render(<ConfirmationView {...defaultProps} />);
    const buttons = container.querySelectorAll("button");
    const cancelButton = Array.from(buttons).find(b => b.textContent === "Отмена");
    fireEvent.click(cancelButton!);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("должен вызывать onConfirm при клике на кнопку подтверждения", () => {
    const { container } = render(<ConfirmationView {...defaultProps} />);
    const buttons = container.querySelectorAll("button");
    const confirmButton = Array.from(buttons).find(b => b.textContent?.includes("Получить отклики"));
    fireEvent.click(confirmButton!);
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("должен вызывать onClose при клике на кнопку закрытия", () => {
    const { container } = render(<ConfirmationView {...defaultProps} />);
    const closeButton = container.querySelector('button[aria-label="Закрыть"]');
    fireEvent.click(closeButton!);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("должен отображать описание с totalResponses для режима analyze", () => {
    const { container } = render(<ConfirmationView {...defaultProps} mode="analyze" totalResponses={50} />);
    const description = container.querySelector(".text-muted-foreground.mb-3");
    expect(description?.textContent?.includes("50")).toBe(true);
  });

  it("должен иметь кнопку закрытия с aria-label", () => {
    const { container } = render(<ConfirmationView {...defaultProps} />);
    const closeButton = container.querySelector('button[aria-label="Закрыть"]');
    expect(closeButton).toBeDefined();
  });
});
