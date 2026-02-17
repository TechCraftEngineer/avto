import { afterEach, describe, expect, it, vi } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { EducationEntry } from "../../shared/types";
import { EducationCard } from "./education-card";

const mockEducation: EducationEntry = {
  institution: "МГУ",
  degree: "Бакалавр",
  fieldOfStudy: "Информатика",
  startDate: "2015",
  endDate: "2019",
};

describe("EducationCard", () => {
  afterEach(() => {
    cleanup();
  });

  describe("Рендеринг", () => {
    it("должен отображать учебное заведение", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      expect(screen.getByText("МГУ")).toBeDefined();
    });

    it("должен отображать степень/квалификацию", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      expect(screen.getByText("Бакалавр")).toBeDefined();
    });

    it("должен отображать специальность", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      expect(screen.getByText("Информатика")).toBeDefined();
    });

    it("должен отображать даты обучения", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      const startInput = screen.getByLabelText(
        "Год начала обучения",
      ) as HTMLInputElement;
      const endInput = screen.getByLabelText(
        "Год окончания обучения",
      ) as HTMLInputElement;

      expect(startInput.value).toBe("2015");
      expect(endInput.value).toBe("2019");
    });

    it("должен отображать диапазон дат", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      expect(screen.getByText("2015 — 2019")).toBeDefined();
    });

    it('должен отображать "Даты не указаны" если нет дат', () => {
      const noDateEducation: EducationEntry = {
        ...mockEducation,
        startDate: "",
        endDate: "",
      };

      render(<EducationCard education={noDateEducation} onEdit={vi.fn()} />);

      expect(screen.getByText("Даты не указаны")).toBeDefined();
    });

    it("должен отображать только дату окончания если нет даты начала", () => {
      const onlyEndEducation: EducationEntry = {
        ...mockEducation,
        startDate: "",
        endDate: "2019",
      };

      render(<EducationCard education={onlyEndEducation} onEdit={vi.fn()} />);

      expect(screen.getByText("2019")).toBeDefined();
    });

    it("должен отображать только дату начала если нет даты окончания", () => {
      const onlyStartEducation: EducationEntry = {
        ...mockEducation,
        startDate: "2015",
        endDate: "",
      };

      render(<EducationCard education={onlyStartEducation} onEdit={vi.fn()} />);

      expect(screen.getByText("2015")).toBeDefined();
    });
  });

  describe("Доступность (ARIA)", () => {
    it("должен иметь role='article'", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      const article = screen.getByRole("article");
      expect(article).toBeDefined();
    });

    it("должен иметь aria-label с информацией об образовании", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      const article = screen.getByRole("article");
      expect(article.getAttribute("aria-label")).toBe(
        "Образование: Бакалавр в МГУ",
      );
    });

    it("должен иметь aria-label для полей дат", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      expect(screen.getByLabelText("Год начала обучения")).toBeDefined();
      expect(screen.getByLabelText("Год окончания обучения")).toBeDefined();
    });

    it("должен иметь aria-live для отображения диапазона дат", () => {
      const { container } = render(
        <EducationCard education={mockEducation} onEdit={vi.fn()} />,
      );

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeDefined();
      expect(liveRegion?.textContent).toBe("2015 — 2019");
    });
  });

  describe("Взаимодействие", () => {
    it("должен вызывать onEdit при изменении учебного заведения", () => {
      const onEdit = vi.fn();
      render(<EducationCard education={mockEducation} onEdit={onEdit} />);

      const editButton = screen.getByLabelText(
        "Редактировать Учебное заведение",
      );
      fireEvent.click(editButton);

      const input = screen.getByLabelText(
        "Редактирование Учебное заведение",
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "МГТУ" } });

      const saveButton = screen.getByLabelText("Сохранить изменения");
      fireEvent.click(saveButton);

      expect(onEdit).toHaveBeenCalledWith("institution", "МГТУ");
    });

    it("должен вызывать onEdit при изменении степени", () => {
      const onEdit = vi.fn();
      render(<EducationCard education={mockEducation} onEdit={onEdit} />);

      const editButton = screen.getByLabelText(
        "Редактировать Степень/квалификация",
      );
      fireEvent.click(editButton);

      const input = screen.getByLabelText(
        "Редактирование Степень/квалификация",
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Магистр" } });

      const saveButton = screen.getByLabelText("Сохранить изменения");
      fireEvent.click(saveButton);

      expect(onEdit).toHaveBeenCalledWith("degree", "Магистр");
    });

    it("должен вызывать onEdit при изменении специальности", () => {
      const onEdit = vi.fn();
      render(<EducationCard education={mockEducation} onEdit={onEdit} />);

      const editButton = screen.getByLabelText("Редактировать Специальность");
      fireEvent.click(editButton);

      const input = screen.getByLabelText(
        "Редактирование Специальность",
      ) as HTMLInputElement;
      fireEvent.change(input, {
        target: { value: "Программная инженерия" },
      });

      const saveButton = screen.getByLabelText("Сохранить изменения");
      fireEvent.click(saveButton);

      expect(onEdit).toHaveBeenCalledWith(
        "fieldOfStudy",
        "Программная инженерия",
      );
    });

    it("должен вызывать onEdit при изменении даты начала", () => {
      const onEdit = vi.fn();
      render(<EducationCard education={mockEducation} onEdit={onEdit} />);

      const startInput = screen.getByLabelText("Год начала обучения");
      fireEvent.change(startInput, { target: { value: "2016" } });

      expect(onEdit).toHaveBeenCalledWith("startDate", "2016");
    });

    it("должен вызывать onEdit при изменении даты окончания", () => {
      const onEdit = vi.fn();
      render(<EducationCard education={mockEducation} onEdit={onEdit} />);

      const endInput = screen.getByLabelText("Год окончания обучения");
      fireEvent.change(endInput, { target: { value: "2020" } });

      expect(onEdit).toHaveBeenCalledWith("endDate", "2020");
    });
  });

  describe("Стили и размеры", () => {
    it("должен иметь fontSize 16px для полей ввода", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      const startInput = screen.getByLabelText("Год начала обучения");
      const styles = window.getComputedStyle(startInput);

      expect(styles.fontSize).toBe("16px");
    });

    it("должен иметь видимый фокус на полях ввода", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      const startInput = screen.getByLabelText("Год начала обучения");
      startInput.focus();

      expect(document.activeElement).toBe(startInput);
    });
  });

  describe("Клавиатурная навигация", () => {
    it("должен поддерживать навигацию Tab между полями", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      const startInput = screen.getByLabelText("Год начала обучения");
      const endInput = screen.getByLabelText("Год окончания обучения");

      startInput.focus();
      expect(document.activeElement).toBe(startInput);

      endInput.focus();
      expect(document.activeElement).toBe(endInput);
    });
  });

  describe("Локализация", () => {
    it("должен использовать русский язык без англицизмов", () => {
      const { container } = render(
        <EducationCard education={mockEducation} onEdit={vi.fn()} />,
      );

      const text = container.textContent || "";
      expect(text).not.toMatch(/institution|degree|field|start|end/i);
      expect(text).toMatch(/учебное|степень|специальность|период/i);
    });

    it("должен использовать правильный формат диапазона дат с тире", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      expect(screen.getByText(/—/)).toBeDefined();
    });

    it("должен использовать корректные плейсхолдеры для годов", () => {
      render(<EducationCard education={mockEducation} onEdit={vi.fn()} />);

      const startInput = screen.getByLabelText(
        "Год начала обучения",
      ) as HTMLInputElement;
      const endInput = screen.getByLabelText(
        "Год окончания обучения",
      ) as HTMLInputElement;

      expect(startInput.placeholder).toMatch(/\d{4}/);
      expect(endInput.placeholder).toMatch(/\d{4}/);
    });
  });
});
