import { beforeEach, describe, expect, it, vi } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";
import { ActionButton } from "./action-button";

describe("ActionButton", () => {
  let mockOnExtract: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnExtract = vi.fn();
  });

  describe("Рендеринг", () => {
    it('должен отображать кнопку с текстом "Извлечь данные"', () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Извлечь данные");
    });

    it('должен отображать текст "Извлечение данных…" при загрузке', () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Извлечение данных…");
    });

    it("должен отображать спиннер при загрузке", () => {
      const { container } = render(
        <ActionButton onExtract={mockOnExtract} isLoading={true} />,
      );

      const spinner = container.querySelector('svg[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });

    it("не должен отображать спиннер когда не загружается", () => {
      const { container } = render(
        <ActionButton onExtract={mockOnExtract} isLoading={false} />,
      );

      const spinner = container.querySelector('svg[aria-hidden="true"]');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe("Доступность (ARIA)", () => {
    it("должен иметь aria-label", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "aria-label",
        "Извлечь данные профиля кандидата",
      );
    });

    it('должен иметь aria-busy="false" когда не загружается', () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-busy", "false");
    });

    it('должен иметь aria-busy="true" при загрузке', () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    it('должен иметь aria-live="polite"', () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-live", "polite");
    });

    it('спиннер должен иметь aria-hidden="true"', () => {
      const { container } = render(
        <ActionButton onExtract={mockOnExtract} isLoading={true} />,
      );

      const spinner = container.querySelector("svg");
      expect(spinner).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Взаимодействие", () => {
    it("должен вызывать onExtract при клике", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnExtract).toHaveBeenCalledTimes(1);
    });

    it("не должен вызывать onExtract при клике во время загрузки", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={true} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockOnExtract).not.toHaveBeenCalled();
    });

    it("должен быть disabled при загрузке", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={true} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("не должен быть disabled когда не загружается", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });
  });

  describe("Стили и размеры", () => {
    it("должен иметь минимальный размер 44x44px", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      const styles = window.getComputedStyle(button);

      expect(styles.minWidth).toBe("44px");
      expect(styles.minHeight).toBe("44px");
    });

    it("должен иметь touch-action: manipulation", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      const styles = window.getComputedStyle(button);

      expect(styles.touchAction).toBe("manipulation");
    });

    it("должен иметь fontSize 16px для мобильных устройств", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      const styles = window.getComputedStyle(button);

      expect(styles.fontSize).toBe("16px");
    });

    it("должен иметь cursor: pointer когда не загружается", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      const styles = window.getComputedStyle(button);

      expect(styles.cursor).toBe("pointer");
    });

    it("должен иметь cursor: not-allowed при загрузке", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={true} />);

      const button = screen.getByRole("button");
      const styles = window.getComputedStyle(button);

      expect(styles.cursor).toBe("not-allowed");
    });
  });

  describe("Клавиатурная навигация", () => {
    it("должен быть доступен через Tab", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it("должен иметь type='button' для корректной работы клавиатуры", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("должен быть нативной кнопкой для автоматической поддержки Enter и Space", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });
  });

  describe("Локализация", () => {
    it("должен использовать русский язык без англицизмов", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={false} />);

      const button = screen.getByRole("button");
      expect(button.textContent).not.toMatch(/extract|load|fetch/i);
      expect(button.textContent).toMatch(/извлечь|данные/i);
    });

    it("должен использовать многоточие (…) в тексте загрузки", () => {
      render(<ActionButton onExtract={mockOnExtract} isLoading={true} />);

      const button = screen.getByRole("button");
      expect(button.textContent).toContain("…");
      expect(button.textContent).not.toContain("...");
    });
  });
});
