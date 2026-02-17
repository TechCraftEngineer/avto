import { afterEach, describe, expect, it, vi } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SkillsList } from "./skills-list";

describe("SkillsList", () => {
  afterEach(() => {
    cleanup();
  });

  describe("Рендеринг", () => {
    it("должен отображать заголовок", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      expect(screen.getByText("Навыки")).toBeDefined();
    });

    it("должен отображать список навыков", () => {
      const skills = ["JavaScript", "React", "TypeScript"];
      render(<SkillsList skills={skills} onEdit={vi.fn()} />);

      expect(screen.getByText("JavaScript")).toBeDefined();
      expect(screen.getByText("React")).toBeDefined();
      expect(screen.getByText("TypeScript")).toBeDefined();
    });

    it('должен отображать "Навыки не указаны" для пустого списка', () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      expect(screen.getByText("Навыки не указаны")).toBeDefined();
    });

    it("должен отображать кнопку редактирования", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      expect(screen.getByLabelText("Редактировать навыки")).toBeDefined();
    });

    it("не должен отображать поле ввода по умолчанию", () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      expect(screen.queryByLabelText("Новый навык")).toBeNull();
    });

    it("не должен отображать кнопки удаления по умолчанию", () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      expect(screen.queryByLabelText(/Удалить навык/)).toBeNull();
    });
  });

  describe("Режим редактирования", () => {
    it("должен переключаться в режим редактирования при клике", () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      expect(screen.getByLabelText("Новый навык")).toBeDefined();
    });

    it('должен изменить текст кнопки на "Готово" в режиме редактирования', () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      expect(screen.getByLabelText("Завершить редактирование")).toBeDefined();
      expect(screen.getByText("Готово")).toBeDefined();
    });

    it("должен отображать кнопки удаления в режиме редактирования", () => {
      render(<SkillsList skills={["JavaScript", "React"]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      expect(screen.getByLabelText("Удалить навык JavaScript")).toBeDefined();
      expect(screen.getByLabelText("Удалить навык React")).toBeDefined();
    });

    it("должен выходить из режима редактирования при повторном клике", () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const doneButton = screen.getByLabelText("Завершить редактирование");
      fireEvent.click(doneButton);

      expect(screen.queryByLabelText("Новый навык")).toBeNull();
    });
  });

  describe("Добавление навыков", () => {
    it("должен вызывать onEdit при добавлении нового навыка", () => {
      const onEdit = vi.fn();
      render(<SkillsList skills={["JavaScript"]} onEdit={onEdit} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      fireEvent.change(input, { target: { value: "Python" } });

      const addButton = screen.getByLabelText("Добавить навык");
      fireEvent.click(addButton);

      expect(onEdit).toHaveBeenCalledWith(["JavaScript", "Python"]);
    });

    it("должен очищать поле ввода после добавления навыка", () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Python" } });

      const addButton = screen.getByLabelText("Добавить навык");
      fireEvent.click(addButton);

      expect(input.value).toBe("");
    });

    it("должен обрезать пробелы при добавлении навыка", () => {
      const onEdit = vi.fn();
      render(<SkillsList skills={["JavaScript"]} onEdit={onEdit} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      fireEvent.change(input, { target: { value: "  Python  " } });

      const addButton = screen.getByLabelText("Добавить навык");
      fireEvent.click(addButton);

      expect(onEdit).toHaveBeenCalledWith(["JavaScript", "Python"]);
    });

    it("не должен добавлять пустой навык", () => {
      const onEdit = vi.fn();
      render(<SkillsList skills={["JavaScript"]} onEdit={onEdit} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      fireEvent.change(input, { target: { value: "   " } });

      const addButton = screen.getByLabelText("Добавить навык");
      fireEvent.click(addButton);

      expect(onEdit).not.toHaveBeenCalled();
    });

    it("не должен добавлять дубликат навыка", () => {
      const onEdit = vi.fn();
      render(<SkillsList skills={["JavaScript"]} onEdit={onEdit} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      fireEvent.change(input, { target: { value: "JavaScript" } });

      const addButton = screen.getByLabelText("Добавить навык");
      fireEvent.click(addButton);

      expect(onEdit).not.toHaveBeenCalled();
    });

    it("должен добавлять навык при нажатии Enter", () => {
      const onEdit = vi.fn();
      render(<SkillsList skills={["JavaScript"]} onEdit={onEdit} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      fireEvent.change(input, { target: { value: "Python" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onEdit).toHaveBeenCalledWith(["JavaScript", "Python"]);
    });
  });

  describe("Удаление навыков", () => {
    it("должен вызывать onEdit при удалении навыка", () => {
      const onEdit = vi.fn();
      render(
        <SkillsList
          skills={["JavaScript", "React", "TypeScript"]}
          onEdit={onEdit}
        />,
      );

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const removeButton = screen.getByLabelText("Удалить навык React");
      fireEvent.click(removeButton);

      expect(onEdit).toHaveBeenCalledWith(["JavaScript", "TypeScript"]);
    });

    it("должен удалять правильный навык", () => {
      const onEdit = vi.fn();
      render(
        <SkillsList
          skills={["JavaScript", "React", "TypeScript"]}
          onEdit={onEdit}
        />,
      );

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const removeButton = screen.getByLabelText("Удалить навык JavaScript");
      fireEvent.click(removeButton);

      expect(onEdit).toHaveBeenCalledWith(["React", "TypeScript"]);
    });
  });

  describe("Доступность (ARIA)", () => {
    it("должен иметь role='list' для списка навыков", () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      const list = screen.getByRole("list");
      expect(list).toBeDefined();
    });

    it("должен иметь aria-label для списка", () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      const list = screen.getByRole("list");
      expect(list.getAttribute("aria-label")).toBe("Список навыков");
    });

    it("должен иметь role='listitem' для каждого навыка", () => {
      render(<SkillsList skills={["JavaScript", "React"]} onEdit={vi.fn()} />);

      const items = screen.getAllByRole("listitem");
      expect(items.length).toBe(2);
    });

    it("должен иметь aria-pressed для кнопки редактирования", () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      expect(editButton.getAttribute("aria-pressed")).toBe("false");

      fireEvent.click(editButton);
      expect(editButton.getAttribute("aria-pressed")).toBe("true");
    });

    it("должен иметь aria-label для кнопки добавления", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      expect(screen.getByLabelText("Добавить навык")).toBeDefined();
    });

    it("должен иметь aria-label для кнопок удаления", () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      expect(screen.getByLabelText("Удалить навык JavaScript")).toBeDefined();
    });
  });

  describe("Стили и размеры", () => {
    it("должен иметь минимальный размер 44x44px для кнопок", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      const styles = window.getComputedStyle(editButton);

      expect(styles.minWidth).toBe("44px");
      expect(styles.minHeight).toBe("44px");
    });

    it("должен иметь fontSize 16px для поля ввода", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      const styles = window.getComputedStyle(input);

      expect(styles.fontSize).toBe("16px");
    });

    it("должен иметь touch-action: manipulation", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      const styles = window.getComputedStyle(editButton);

      expect(styles.touchAction).toBe("manipulation");
    });

    it("должен иметь cursor: not-allowed для disabled кнопки", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const addButton = screen.getByLabelText(
        "Добавить навык",
      ) as HTMLButtonElement;
      const styles = window.getComputedStyle(addButton);

      expect(addButton.disabled).toBe(true);
      expect(styles.cursor).toBe("not-allowed");
    });

    it("должен иметь cursor: pointer для enabled кнопки", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      fireEvent.change(input, { target: { value: "Python" } });

      const addButton = screen.getByLabelText(
        "Добавить навык",
      ) as HTMLButtonElement;
      const styles = window.getComputedStyle(addButton);

      expect(addButton.disabled).toBe(false);
      expect(styles.cursor).toBe("pointer");
    });
  });

  describe("Клавиатурная навигация", () => {
    it("должен поддерживать фокус на кнопке редактирования", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      editButton.focus();

      expect(document.activeElement).toBe(editButton);
    });

    it("должен поддерживать фокус на поле ввода", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      input.focus();

      expect(document.activeElement).toBe(input);
    });

    it("должен поддерживать фокус на кнопке добавления", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      fireEvent.change(input, { target: { value: "Python" } });

      const addButton = screen.getByLabelText("Добавить навык");
      addButton.focus();

      expect(document.activeElement).toBe(addButton);
    });

    it("должен поддерживать фокус на кнопках удаления", () => {
      render(<SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const removeButton = screen.getByLabelText("Удалить навык JavaScript");
      removeButton.focus();

      expect(document.activeElement).toBe(removeButton);
    });
  });

  describe("Локализация", () => {
    it("должен использовать русский язык без англицизмов", () => {
      const { container } = render(
        <SkillsList skills={["JavaScript"]} onEdit={vi.fn()} />,
      );

      const text = container.textContent || "";
      expect(text).not.toMatch(/skills|add|remove|edit/i);
      expect(text).toMatch(/навыки|изменить/i);
    });

    it("должен использовать многоточие (…) в плейсхолдере", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык") as HTMLInputElement;
      expect(input.placeholder).toContain("…");
      expect(input.placeholder).not.toContain("...");
    });

    it('должен использовать "Готово" вместо "Done"', () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      expect(screen.getByText("Готово")).toBeDefined();
    });
  });

  describe("Состояния кнопки добавления", () => {
    it("должна быть disabled когда поле пустое", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const addButton = screen.getByLabelText(
        "Добавить навык",
      ) as HTMLButtonElement;
      expect(addButton.disabled).toBe(true);
    });

    it("должна быть enabled когда есть текст", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      fireEvent.change(input, { target: { value: "Python" } });

      const addButton = screen.getByLabelText(
        "Добавить навык",
      ) as HTMLButtonElement;
      expect(addButton.disabled).toBe(false);
    });

    it("должна быть disabled когда только пробелы", () => {
      render(<SkillsList skills={[]} onEdit={vi.fn()} />);

      const editButton = screen.getByLabelText("Редактировать навыки");
      fireEvent.click(editButton);

      const input = screen.getByLabelText("Новый навык");
      fireEvent.change(input, { target: { value: "   " } });

      const addButton = screen.getByLabelText(
        "Добавить навык",
      ) as HTMLButtonElement;
      expect(addButton.disabled).toBe(true);
    });
  });
});
