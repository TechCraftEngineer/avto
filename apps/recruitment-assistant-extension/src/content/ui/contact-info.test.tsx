import { afterEach, describe, expect, it, vi } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ContactInfo as ContactInfoType } from "../../shared/types";
import { ContactInfo } from "./contact-info";

const mockContacts: ContactInfoType = {
  email: "ivan@example.com",
  phone: "+7 999 123 45 67",
  socialLinks: ["https://github.com/ivan", "https://linkedin.com/in/ivan"],
};

describe("ContactInfo", () => {
  afterEach(() => {
    cleanup();
  });

  describe("Рендеринг", () => {
    it("должен отображать заголовок", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      expect(screen.getByText("Контактная информация")).toBeDefined();
    });

    it("должен отображать поле электронной почты", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const emailInput = screen.getByLabelText(
        "Электронная почта кандидата",
      ) as HTMLInputElement;
      expect(emailInput.value).toBe("ivan@example.com");
    });

    it("должен отображать поле телефона", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const phoneInput = screen.getByLabelText(
        "Номер телефона кандидата",
      ) as HTMLInputElement;
      expect(phoneInput.value).toBe("+7 999 123 45 67");
    });

    it("должен отображать список социальных сетей", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      expect(screen.getByText("https://github.com/ivan")).toBeDefined();
      expect(screen.getByText("https://linkedin.com/in/ivan")).toBeDefined();
    });

    it("должен отображать пустые поля для null значений", () => {
      const emptyContacts: ContactInfoType = {
        email: null,
        phone: null,
        socialLinks: [],
      };

      render(<ContactInfo contacts={emptyContacts} onEdit={vi.fn()} />);

      const emailInput = screen.getByLabelText(
        "Электронная почта кандидата",
      ) as HTMLInputElement;
      const phoneInput = screen.getByLabelText(
        "Номер телефона кандидата",
      ) as HTMLInputElement;

      expect(emailInput.value).toBe("");
      expect(phoneInput.value).toBe("");
    });

    it('должен отображать "Ссылки не добавлены" для пустого списка', () => {
      const noLinksContacts: ContactInfoType = {
        email: "test@example.com",
        phone: null,
        socialLinks: [],
      };

      render(<ContactInfo contacts={noLinksContacts} onEdit={vi.fn()} />);

      expect(screen.getByText("Ссылки не добавлены")).toBeDefined();
    });
  });

  describe("Редактирование email", () => {
    it("должен вызывать onEdit при изменении email", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const emailInput = screen.getByLabelText("Электронная почта кандидата");
      fireEvent.change(emailInput, { target: { value: "new@example.com" } });

      expect(onEdit).toHaveBeenCalledWith("email", "new@example.com");
    });

    it("должен вызывать onEdit с null при очистке email", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const emailInput = screen.getByLabelText("Электронная почта кандидата");
      fireEvent.change(emailInput, { target: { value: "" } });

      expect(onEdit).toHaveBeenCalledWith("email", null);
    });

    it("должен иметь type='email' для поля email", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const emailInput = screen.getByLabelText(
        "Электронная почта кандидата",
      ) as HTMLInputElement;
      expect(emailInput.type).toBe("email");
    });

    it("должен иметь autocomplete='email'", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const emailInput = screen.getByLabelText("Электронная почта кандидата");
      expect(emailInput.getAttribute("autocomplete")).toBe("email");
    });

    it("должен иметь spellCheck=false для email", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const emailInput = screen.getByLabelText("Электронная почта кандидата");
      expect(emailInput.getAttribute("spellcheck")).toBe("false");
    });
  });

  describe("Редактирование телефона", () => {
    it("должен вызывать onEdit при изменении телефона", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const phoneInput = screen.getByLabelText("Номер телефона кандидата");
      fireEvent.change(phoneInput, { target: { value: "+7 999 999 99 99" } });

      expect(onEdit).toHaveBeenCalledWith("phone", "+7 999 999 99 99");
    });

    it("должен вызывать onEdit с null при очистке телефона", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const phoneInput = screen.getByLabelText("Номер телефона кандидата");
      fireEvent.change(phoneInput, { target: { value: "" } });

      expect(onEdit).toHaveBeenCalledWith("phone", null);
    });

    it("должен иметь type='tel' для поля телефона", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const phoneInput = screen.getByLabelText(
        "Номер телефона кандидата",
      ) as HTMLInputElement;
      expect(phoneInput.type).toBe("tel");
    });

    it("должен иметь autocomplete='tel'", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const phoneInput = screen.getByLabelText("Номер телефона кандидата");
      expect(phoneInput.getAttribute("autocomplete")).toBe("tel");
    });
  });

  describe("Добавление ссылок", () => {
    it("должен вызывать onEdit при добавлении новой ссылки", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const input = screen.getByLabelText("Новая ссылка на социальную сеть");
      fireEvent.change(input, {
        target: { value: "https://twitter.com/ivan" },
      });

      const addButton = screen.getByLabelText("Добавить ссылку");
      fireEvent.click(addButton);

      expect(onEdit).toHaveBeenCalledWith("socialLinks", [
        "https://github.com/ivan",
        "https://linkedin.com/in/ivan",
        "https://twitter.com/ivan",
      ]);
    });

    it("должен очищать поле ввода после добавления ссылки", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const input = screen.getByLabelText(
        "Новая ссылка на социальную сеть",
      ) as HTMLInputElement;
      fireEvent.change(input, {
        target: { value: "https://twitter.com/ivan" },
      });

      const addButton = screen.getByLabelText("Добавить ссылку");
      fireEvent.click(addButton);

      expect(input.value).toBe("");
    });

    it("должен обрезать пробелы при добавлении ссылки", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const input = screen.getByLabelText("Новая ссылка на социальную сеть");
      fireEvent.change(input, {
        target: { value: "  https://twitter.com/ivan  " },
      });

      const addButton = screen.getByLabelText("Добавить ссылку");
      fireEvent.click(addButton);

      expect(onEdit).toHaveBeenCalledWith("socialLinks", [
        "https://github.com/ivan",
        "https://linkedin.com/in/ivan",
        "https://twitter.com/ivan",
      ]);
    });

    it("не должен добавлять пустую ссылку", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const input = screen.getByLabelText("Новая ссылка на социальную сеть");
      fireEvent.change(input, { target: { value: "   " } });

      const addButton = screen.getByLabelText("Добавить ссылку");
      fireEvent.click(addButton);

      expect(onEdit).not.toHaveBeenCalled();
    });

    it("не должен добавлять некорректный URL", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const input = screen.getByLabelText("Новая ссылка на социальную сеть");
      fireEvent.change(input, { target: { value: "не-ссылка" } });

      const addButton = screen.getByLabelText("Добавить ссылку");
      fireEvent.click(addButton);

      expect(onEdit).not.toHaveBeenCalled();
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toMatch(/корректный URL/i);
    });

    it("не должен добавлять дубликат ссылки", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const input = screen.getByLabelText("Новая ссылка на социальную сеть");
      fireEvent.change(input, {
        target: { value: "https://github.com/ivan" },
      });

      const addButton = screen.getByLabelText("Добавить ссылку");
      fireEvent.click(addButton);

      expect(onEdit).not.toHaveBeenCalled();
    });

    it("должен добавлять ссылку при нажатии Enter", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const input = screen.getByLabelText("Новая ссылка на социальную сеть");
      fireEvent.change(input, {
        target: { value: "https://twitter.com/ivan" },
      });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onEdit).toHaveBeenCalledWith("socialLinks", [
        "https://github.com/ivan",
        "https://linkedin.com/in/ivan",
        "https://twitter.com/ivan",
      ]);
    });

    it("должен иметь type='url' для поля ссылки", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const input = screen.getByLabelText(
        "Новая ссылка на социальную сеть",
      ) as HTMLInputElement;
      expect(input.type).toBe("url");
    });
  });

  describe("Удаление ссылок", () => {
    it("должен вызывать onEdit при удалении ссылки", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const removeButton = screen.getByLabelText(
        "Удалить ссылку https://github.com/ivan",
      );
      fireEvent.click(removeButton);

      expect(onEdit).toHaveBeenCalledWith("socialLinks", [
        "https://linkedin.com/in/ivan",
      ]);
    });

    it("должен удалять правильную ссылку", () => {
      const onEdit = vi.fn();
      render(<ContactInfo contacts={mockContacts} onEdit={onEdit} />);

      const removeButton = screen.getByLabelText(
        "Удалить ссылку https://linkedin.com/in/ivan",
      );
      fireEvent.click(removeButton);

      expect(onEdit).toHaveBeenCalledWith("socialLinks", [
        "https://github.com/ivan",
      ]);
    });
  });

  describe("Доступность (ARIA)", () => {
    it("должен иметь role='list' для списка ссылок", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const list = screen.getByRole("list");
      expect(list).toBeDefined();
    });

    it("должен иметь aria-label для списка", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const list = screen.getByRole("list");
      expect(list.getAttribute("aria-label")).toBe("Список социальных сетей");
    });

    it("должен иметь role='listitem' для каждой ссылки", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const items = screen.getAllByRole("listitem");
      expect(items.length).toBe(2);
    });

    it("должен иметь aria-label для полей ввода", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      expect(
        screen.getByLabelText("Электронная почта кандидата"),
      ).toBeDefined();
      expect(screen.getByLabelText("Номер телефона кандидата")).toBeDefined();
      expect(
        screen.getByLabelText("Новая ссылка на социальную сеть"),
      ).toBeDefined();
    });

    it("должен иметь aria-label для кнопок", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      expect(screen.getByLabelText("Добавить ссылку")).toBeDefined();
      expect(
        screen.getByLabelText("Удалить ссылку https://github.com/ivan"),
      ).toBeDefined();
    });
  });

  describe("Стили и размеры", () => {
    it("должен иметь минимальный размер 44x44px для кнопок", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const addButton = screen.getByLabelText("Добавить ссылку");
      const styles = window.getComputedStyle(addButton);

      expect(styles.minWidth).toBe("44px");
      expect(styles.minHeight).toBe("44px");
    });

    it("должен иметь fontSize 16px для полей ввода", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const emailInput = screen.getByLabelText("Электронная почта кандидата");
      const styles = window.getComputedStyle(emailInput);

      expect(styles.fontSize).toBe("16px");
    });

    it("должен иметь touch-action: manipulation для кнопок", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const addButton = screen.getByLabelText("Добавить ссылку");
      const styles = window.getComputedStyle(addButton);

      expect(styles.touchAction).toBe("manipulation");
    });

    it("должен иметь cursor: not-allowed для disabled кнопки", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const addButton = screen.getByLabelText(
        "Добавить ссылку",
      ) as HTMLButtonElement;
      const styles = window.getComputedStyle(addButton);

      expect(addButton.disabled).toBe(true);
      expect(styles.cursor).toBe("not-allowed");
    });

    it("должен иметь cursor: pointer для enabled кнопки", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const input = screen.getByLabelText("Новая ссылка на социальную сеть");
      fireEvent.change(input, {
        target: { value: "https://twitter.com/ivan" },
      });

      const addButton = screen.getByLabelText(
        "Добавить ссылку",
      ) as HTMLButtonElement;
      const styles = window.getComputedStyle(addButton);

      expect(addButton.disabled).toBe(false);
      expect(styles.cursor).toBe("pointer");
    });
  });

  describe("Клавиатурная навигация", () => {
    it("должен поддерживать фокус на полях ввода", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const emailInput = screen.getByLabelText("Электронная почта кандидата");
      emailInput.focus();

      expect(document.activeElement).toBe(emailInput);
    });

    it("должен поддерживать фокус на кнопках", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const input = screen.getByLabelText("Новая ссылка на социальную сеть");
      fireEvent.change(input, {
        target: { value: "https://twitter.com/ivan" },
      });

      const addButton = screen.getByLabelText("Добавить ссылку");
      addButton.focus();

      expect(document.activeElement).toBe(addButton);
    });

    it("должен поддерживать фокус на ссылках", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const link = screen.getByText("https://github.com/ivan");
      link.focus();

      expect(document.activeElement).toBe(link);
    });
  });

  describe("Локализация", () => {
    it("должен использовать русский язык без англицизмов", () => {
      const { container } = render(
        <ContactInfo contacts={mockContacts} onEdit={vi.fn()} />,
      );

      const text = container.textContent || "";
      expect(text).not.toMatch(/contact|email|phone|social|add|remove/i);
      expect(text).toMatch(/контакт|почта|телефон|социальн|добавить/i);
    });

    it("должен использовать правильный плейсхолдер для email", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const emailInput = screen.getByLabelText(
        "Электронная почта кандидата",
      ) as HTMLInputElement;
      expect(emailInput.placeholder).toBe("example@company.com");
    });

    it("должен использовать правильный плейсхолдер для телефона", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const phoneInput = screen.getByLabelText(
        "Номер телефона кандидата",
      ) as HTMLInputElement;
      expect(phoneInput.placeholder).toMatch(/\+7.*\d/);
    });

    it("должен использовать правильный плейсхолдер для ссылки", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const input = screen.getByLabelText(
        "Новая ссылка на социальную сеть",
      ) as HTMLInputElement;
      expect(input.placeholder).toMatch(/https:\/\//);
    });
  });

  describe("Ссылки", () => {
    it("должны открываться в новой вкладке", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const link = screen.getByText(
        "https://github.com/ivan",
      ) as HTMLAnchorElement;
      expect(link.target).toBe("_blank");
    });

    it("должны иметь rel='noopener noreferrer'", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const link = screen.getByText(
        "https://github.com/ivan",
      ) as HTMLAnchorElement;
      expect(link.rel).toBe("noopener noreferrer");
    });

    it("должны иметь правильный href", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const link = screen.getByText(
        "https://github.com/ivan",
      ) as HTMLAnchorElement;
      expect(link.href).toBe("https://github.com/ivan");
    });
  });

  describe("Состояния кнопки добавления", () => {
    it("должна быть disabled когда поле пустое", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const addButton = screen.getByLabelText(
        "Добавить ссылку",
      ) as HTMLButtonElement;
      expect(addButton.disabled).toBe(true);
    });

    it("должна быть enabled когда есть текст", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const input = screen.getByLabelText("Новая ссылка на социальную сеть");
      fireEvent.change(input, {
        target: { value: "https://twitter.com/ivan" },
      });

      const addButton = screen.getByLabelText(
        "Добавить ссылку",
      ) as HTMLButtonElement;
      expect(addButton.disabled).toBe(false);
    });

    it("должна быть disabled когда только пробелы", () => {
      render(<ContactInfo contacts={mockContacts} onEdit={vi.fn()} />);

      const input = screen.getByLabelText("Новая ссылка на социальную сеть");
      fireEvent.change(input, { target: { value: "   " } });

      const addButton = screen.getByLabelText(
        "Добавить ссылку",
      ) as HTMLButtonElement;
      expect(addButton.disabled).toBe(true);
    });
  });
});
