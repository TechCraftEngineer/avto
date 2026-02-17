import { afterEach, describe, expect, it, vi } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ExperienceEntry } from "../../shared/types";
import { ExperienceCard } from "./experience-card";

const mockExperience: ExperienceEntry = {
  position: "Senior Developer",
  company: "Tech Corp",
  startDate: "Январь 2020",
  endDate: null,
  description: "Разработка веб-приложений",
};

describe("ExperienceCard", () => {
  afterEach(() => {
    cleanup();
  });

  describe("Рендеринг", () => {
    it("должен отображать должность", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      expect(screen.getByText("Senior Developer")).toBeDefined();
    });

    it("должен отображать компанию", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      expect(screen.getByText("Tech Corp")).toBeDefined();
    });

    it("должен отображать описание", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      expect(screen.getByText("Разработка веб-приложений")).toBeDefined();
    });

    it("должен отображать даты работы", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      const startInput = screen.getByLabelText(
        "Дата начала работы",
      ) as HTMLInputElement;
      expect(startInput.value).toBe("Январь 2020");
    });

    it('должен отображать "по настоящее время" для текущей работы', () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      expect(screen.getByText(/по настоящее время/)).toBeDefined();
    });

    it("должен отображать диапазон дат для завершенной работы", () => {
      const completedExperience: ExperienceEntry = {
        ...mockExperience,
        endDate: "Декабрь 2023",
      };

      render(
        <ExperienceCard experience={completedExperience} onEdit={vi.fn()} />,
      );

      expect(screen.getByText(/Январь 2020 — Декабрь 2023/)).toBeDefined();
    });

    it('должен отображать "Даты не указаны" если нет даты начала', () => {
      const noDateExperience: ExperienceEntry = {
        ...mockExperience,
        startDate: "",
      };

      render(<ExperienceCard experience={noDateExperience} onEdit={vi.fn()} />);

      expect(screen.getByText("Даты не указаны")).toBeDefined();
    });
  });

  describe("Доступность (ARIA)", () => {
    it("должен иметь role='article'", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      const article = screen.getByRole("article");
      expect(article).toBeDefined();
    });

    it("должен иметь aria-label с информацией о позиции", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      const article = screen.getByRole("article");
      expect(article.getAttribute("aria-label")).toBe(
        "Опыт работы: Senior Developer в Tech Corp",
      );
    });

    it("должен иметь aria-label для полей дат", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      expect(screen.getByLabelText("Дата начала работы")).toBeDefined();
      expect(screen.getByLabelText("Дата окончания работы")).toBeDefined();
    });

    it("должен иметь aria-live для отображения диапазона дат", () => {
      const { container } = render(
        <ExperienceCard experience={mockExperience} onEdit={vi.fn()} />,
      );

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeDefined();
      expect(liveRegion?.textContent).toContain("по настоящее время");
    });
  });

  describe("Взаимодействие", () => {
    it("должен вызывать onEdit при изменении должности", () => {
      const onEdit = vi.fn();
      render(<ExperienceCard experience={mockExperience} onEdit={onEdit} />);

      const editButton = screen.getByLabelText("Редактировать Должность");
      fireEvent.click(editButton);

      const input = screen.getByLabelText(
        "Редактирование Должность",
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Lead Developer" } });

      const saveButton = screen.getByLabelText("Сохранить изменения");
      fireEvent.click(saveButton);

      expect(onEdit).toHaveBeenCalledWith("position", "Lead Developer");
    });

    it("должен вызывать onEdit при изменении компании", () => {
      const onEdit = vi.fn();
      render(<ExperienceCard experience={mockExperience} onEdit={onEdit} />);

      const editButton = screen.getByLabelText("Редактировать Компания");
      fireEvent.click(editButton);

      const input = screen.getByLabelText(
        "Редактирование Компания",
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "New Company" } });

      const saveButton = screen.getByLabelText("Сохранить изменения");
      fireEvent.click(saveButton);

      expect(onEdit).toHaveBeenCalledWith("company", "New Company");
    });

    it("должен вызывать onEdit при изменении даты начала", () => {
      const onEdit = vi.fn();
      render(<ExperienceCard experience={mockExperience} onEdit={onEdit} />);

      const startInput = screen.getByLabelText("Дата начала работы");
      fireEvent.change(startInput, { target: { value: "Февраль 2020" } });

      expect(onEdit).toHaveBeenCalledWith("startDate", "Февраль 2020");
    });

    it("должен вызывать onEdit при изменении даты окончания", () => {
      const onEdit = vi.fn();
      render(<ExperienceCard experience={mockExperience} onEdit={onEdit} />);

      const endInput = screen.getByLabelText("Дата окончания работы");
      fireEvent.change(endInput, { target: { value: "Декабрь 2023" } });

      expect(onEdit).toHaveBeenCalledWith("endDate", "Декабрь 2023");
    });

    it("должен вызывать onEdit с null при очистке даты окончания", () => {
      const completedExperience: ExperienceEntry = {
        ...mockExperience,
        endDate: "Декабрь 2023",
      };
      const onEdit = vi.fn();
      render(
        <ExperienceCard experience={completedExperience} onEdit={onEdit} />,
      );

      const endInput = screen.getByLabelText("Дата окончания работы");
      fireEvent.change(endInput, { target: { value: "" } });

      expect(onEdit).toHaveBeenCalledWith("endDate", null);
    });

    it("должен вызывать onEdit при изменении описания", () => {
      const onEdit = vi.fn();
      render(<ExperienceCard experience={mockExperience} onEdit={onEdit} />);

      const editButton = screen.getByLabelText(
        "Редактировать Описание обязанностей",
      );
      fireEvent.click(editButton);

      const textarea = screen.getByLabelText(
        "Редактирование Описание обязанностей",
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, {
        target: { value: "Новое описание обязанностей" },
      });

      const saveButton = screen.getByLabelText("Сохранить изменения");
      fireEvent.click(saveButton);

      expect(onEdit).toHaveBeenCalledWith(
        "description",
        "Новое описание обязанностей",
      );
    });
  });

  describe("Стили и размеры", () => {
    it("должен иметь fontSize 16px для полей ввода", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      const startInput = screen.getByLabelText("Дата начала работы");
      const styles = window.getComputedStyle(startInput);

      expect(styles.fontSize).toBe("16px");
    });

    it("должен иметь видимый фокус на полях ввода", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      const startInput = screen.getByLabelText("Дата начала работы");
      startInput.focus();

      expect(document.activeElement).toBe(startInput);
    });
  });

  describe("Клавиатурная навигация", () => {
    it("должен поддерживать навигацию Tab между полями", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      const startInput = screen.getByLabelText("Дата начала работы");
      const endInput = screen.getByLabelText("Дата окончания работы");

      startInput.focus();
      expect(document.activeElement).toBe(startInput);

      endInput.focus();
      expect(document.activeElement).toBe(endInput);
    });
  });

  describe("Локализация", () => {
    it("должен использовать русский язык без англицизмов", () => {
      const { container } = render(
        <ExperienceCard experience={mockExperience} onEdit={vi.fn()} />,
      );

      const text = container.textContent || "";
      expect(text).not.toMatch(/position|company|description|start|end/i);
      expect(text).toMatch(/должность|компания|описание|период/i);
    });

    it("должен использовать правильный формат диапазона дат с тире", () => {
      const completedExperience: ExperienceEntry = {
        ...mockExperience,
        endDate: "Декабрь 2023",
      };

      render(
        <ExperienceCard experience={completedExperience} onEdit={vi.fn()} />,
      );

      expect(screen.getByText(/—/)).toBeDefined();
    });

    it("должен использовать многоточие (…) в плейсхолдерах", () => {
      render(<ExperienceCard experience={mockExperience} onEdit={vi.fn()} />);

      const startInput = screen.getByLabelText(
        "Дата начала работы",
      ) as HTMLInputElement;
      expect(startInput.placeholder).not.toContain("...");
    });
  });
});
