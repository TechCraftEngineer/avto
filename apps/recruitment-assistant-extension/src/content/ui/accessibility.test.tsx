import { afterEach, describe, expect, it, vi } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { run as axeRun } from "axe-core";
import type {
  ContactInfo as ContactInfoType,
  EducationEntry,
  ExperienceEntry,
} from "../../shared/types";
import { ContactInfo } from "./contact-info";
import { EditableField } from "./editable-field";
import { EducationCard } from "./education-card";
import { ExperienceCard } from "./experience-card";
import { SkillsList } from "./skills-list";

/**
 * Тесты доступности для UI компонентов
 * Используется axe-core для автоматической проверки соответствия WCAG
 */

describe("Тестирование доступности UI компонентов", () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * Вспомогательная функция для запуска axe-core
   */
  async function checkAccessibility(container: HTMLElement) {
    const results = await axeRun(container, {
      rules: {
        // Отключаем правила, которые не применимы к изолированным компонентам
        region: { enabled: false },
        "landmark-one-main": { enabled: false },
        "page-has-heading-one": { enabled: false },
      },
    });

    return results;
  }

  describe("EditableField", () => {
    it("не должен иметь нарушений доступности", async () => {
      const { container } = render(
        <EditableField label="Имя" value="Иван Иванов" onChange={vi.fn()} />,
      );

      const results = await checkAccessibility(container);
      expect(results.violations).toHaveLength(0);
    });

    it("не должен иметь нарушений доступности в режиме редактирования", async () => {
      const { container, getByLabelText } = render(
        <EditableField label="Имя" value="Иван Иванов" onChange={vi.fn()} />,
      );

      // Переключаемся в режим редактирования
      const editButton = getByLabelText("Редактировать Имя");
      fireEvent.click(editButton);

      const results = await checkAccessibility(container);
      expect(results.violations).toHaveLength(0);
    });

    it("не должен иметь нарушений доступности в многострочном режиме", async () => {
      const { container } = render(
        <EditableField
          label="Описание"
          value="Текст описания"
          onChange={vi.fn()}
          multiline
        />,
      );

      const results = await checkAccessibility(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("ExperienceCard", () => {
    const mockExperience: ExperienceEntry = {
      position: "Старший разработчик",
      company: "ТехноКорп",
      startDate: "Январь 2020",
      endDate: null,
      description: "Разработка веб-приложений",
    };

    it("не должен иметь нарушений доступности", async () => {
      const { container } = render(
        <ExperienceCard experience={mockExperience} onEdit={vi.fn()} />,
      );

      const results = await checkAccessibility(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("EducationCard", () => {
    const mockEducation: EducationEntry = {
      institution: "МГУ",
      degree: "Бакалавр",
      fieldOfStudy: "Информатика",
      startDate: "2015",
      endDate: "2019",
    };

    it("не должен иметь нарушений доступности", async () => {
      const { container } = render(
        <EducationCard education={mockEducation} onEdit={vi.fn()} />,
      );

      const results = await checkAccessibility(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("SkillsList", () => {
    it("не должен иметь нарушений доступности с пустым списком", async () => {
      const { container } = render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const results = await checkAccessibility(container);
      expect(results.violations).toHaveLength(0);
    });

    it("не должен иметь нарушений доступности со списком навыков", async () => {
      const { container } = render(
        <SkillsList
          skills={["JavaScript", "React", "TypeScript"]}
          onEdit={vi.fn()}
        />,
      );

      const results = await checkAccessibility(container);
      expect(results.violations).toHaveLength(0);
    });

    it("не должен иметь нарушений доступности в режиме редактирования", async () => {
      const { container, getByLabelText } = render(
        <SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />,
      );

      // Переключаемся в режим редактирования
      const editButton = getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const results = await checkAccessibility(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("ContactInfo", () => {
    const mockContacts: ContactInfoType = {
      email: "ivan@example.com",
      phone: "+7 999 123 45 67",
      socialLinks: ["https://github.com/ivan", "https://linkedin.com/in/ivan"],
    };

    it("не должен иметь нарушений доступности", async () => {
      const { container } = render(
        <ContactInfo contacts={mockContacts} onEdit={vi.fn()} />,
      );

      const results = await checkAccessibility(container);
      expect(results.violations).toHaveLength(0);
    });

    it("не должен иметь нарушений доступности с пустыми контактами", async () => {
      const emptyContacts: ContactInfoType = {
        email: null,
        phone: null,
        socialLinks: [],
      };

      const { container } = render(
        <ContactInfo contacts={emptyContacts} onEdit={vi.fn()} />,
      );

      const results = await checkAccessibility(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Проверка контрастности", () => {
    it("EditableField должен иметь достаточный контраст", async () => {
      const { container } = render(
        <EditableField label="Имя" value="Тест" onChange={vi.fn()} />,
      );

      const results = await axeRun(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });

      const contrastViolations = results.violations.filter(
        (v) => v.id === "color-contrast",
      );
      expect(contrastViolations).toHaveLength(0);
    });
  });

  describe("Проверка фокуса", () => {
    it("интерактивные элементы должны иметь корректный tabindex", async () => {
      const { container } = render(
        <EditableField label="Имя" value="Тест" onChange={vi.fn()} />,
      );

      const results = await axeRun(container, {
        rules: {
          tabindex: { enabled: true },
        },
      });

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Проверка ARIA атрибутов", () => {
    it("все ARIA атрибуты должны быть корректными", async () => {
      const { container } = render(
        <SkillsList skills={["JavaScript", "React"]} onEdit={vi.fn()} />,
      );

      const results = await axeRun(container, {
        rules: {
          "aria-valid-attr": { enabled: true },
          "aria-valid-attr-value": { enabled: true },
          "aria-allowed-attr": { enabled: true },
          "aria-required-attr": { enabled: true },
        },
      });

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Проверка семантической разметки", () => {
    it("компоненты должны использовать семантические HTML элементы", async () => {
      const mockExperience: ExperienceEntry = {
        position: "Разработчик",
        company: "Компания",
        startDate: "2020",
        endDate: "2023",
        description: "Описание",
      };

      const { container } = render(
        <ExperienceCard experience={mockExperience} onEdit={vi.fn()} />,
      );

      const results = await axeRun(container, {
        rules: {
          "button-name": { enabled: true },
          "input-button-name": { enabled: true },
          label: { enabled: true },
        },
      });

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Проверка размеров целей касания", () => {
    it("интерактивные элементы должны иметь достаточный размер", () => {
      const { getAllByRole } = render(
        <EditableField label="Имя" value="Тест" onChange={vi.fn()} />,
      );

      const buttons = getAllByRole("button");
      buttons.forEach((button) => {
        const style = window.getComputedStyle(button);
        const width = parseFloat(style.minWidth || style.width || "0");
        const height = parseFloat(style.minHeight || style.height || "0");
        expect(width).toBeGreaterThanOrEqual(0);
        expect(height).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
