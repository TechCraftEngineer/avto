import { afterEach, describe, expect, it, vi } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EditableField } from "./editable-field";

describe("EditableField", () => {
  afterEach(() => {
    cleanup();
  });

  it("должен отображать значение поля", () => {
    render(
      <EditableField label="Имя" value="Иван Иванов" onChange={vi.fn()} />,
    );

    expect(screen.getByText("Иван Иванов")).toBeDefined();
  });

  it("должен отображать 'Не указано' для пустого значения", () => {
    render(<EditableField label="Имя" value="" onChange={vi.fn()} />);

    expect(screen.getByText("Не указано")).toBeDefined();
  });

  it("должен переключаться в режим редактирования при клике на кнопку", () => {
    render(
      <EditableField label="Имя" value="Иван Иванов" onChange={vi.fn()} />,
    );

    const editButton = screen.getByLabelText("Редактировать Имя");
    fireEvent.click(editButton);

    expect(screen.getByLabelText("Редактирование Имя")).toBeDefined();
  });

  it("должен вызывать onChange при сохранении", () => {
    const onChange = vi.fn();
    render(
      <EditableField label="Имя" value="Иван Иванов" onChange={onChange} />,
    );

    const editButton = screen.getByLabelText("Редактировать Имя");
    fireEvent.click(editButton);

    const input = screen.getByLabelText(
      "Редактирование Имя",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Петр Петров" } });

    const saveButton = screen.getByLabelText("Сохранить изменения");
    fireEvent.click(saveButton);

    expect(onChange).toHaveBeenCalledWith("Петр Петров");
  });

  it("должен отменять изменения при нажатии на кнопку отмены", () => {
    const onChange = vi.fn();
    render(
      <EditableField label="Имя" value="Иван Иванов" onChange={onChange} />,
    );

    const editButton = screen.getByLabelText("Редактировать Имя");
    fireEvent.click(editButton);

    const input = screen.getByLabelText(
      "Редактирование Имя",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Петр Петров" } });

    const cancelButton = screen.getByLabelText("Отменить изменения");
    fireEvent.click(cancelButton);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Иван Иванов")).toBeDefined();
  });

  it("должен сохранять при нажатии Enter в однострочном поле", () => {
    const onChange = vi.fn();
    render(
      <EditableField label="Имя" value="Иван Иванов" onChange={onChange} />,
    );

    const editButton = screen.getByLabelText("Редактировать Имя");
    fireEvent.click(editButton);

    const input = screen.getByLabelText(
      "Редактирование Имя",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Петр Петров" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("Петр Петров");
  });

  it("должен отменять при нажатии Escape", () => {
    const onChange = vi.fn();
    render(
      <EditableField label="Имя" value="Иван Иванов" onChange={onChange} />,
    );

    const editButton = screen.getByLabelText("Редактировать Имя");
    fireEvent.click(editButton);

    const input = screen.getByLabelText(
      "Редактирование Имя",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Петр Петров" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("должен поддерживать многострочный режим", () => {
    render(
      <EditableField
        label="Описание"
        value="Текст описания"
        onChange={vi.fn()}
        multiline
      />,
    );

    const editButton = screen.getByLabelText("Редактировать Описание");
    fireEvent.click(editButton);

    const textarea = screen.getByLabelText(
      "Редактирование Описание",
    ) as HTMLTextAreaElement;
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("должен сохранять в многострочном поле при Cmd+Enter", () => {
    const onChange = vi.fn();
    render(
      <EditableField
        label="Описание"
        value="Текст"
        onChange={onChange}
        multiline
      />,
    );

    const editButton = screen.getByLabelText("Редактировать Описание");
    fireEvent.click(editButton);

    const textarea = screen.getByLabelText(
      "Редактирование Описание",
    ) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Новый текст" } });
    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

    expect(onChange).toHaveBeenCalledWith("Новый текст");
  });

  it("должен скрывать кнопку редактирования когда disabled", () => {
    render(
      <EditableField
        label="Имя"
        value="Иван Иванов"
        onChange={vi.fn()}
        disabled
      />,
    );

    expect(screen.queryByLabelText("Редактировать Имя")).toBeNull();
  });

  it("должен обрезать пробелы при сохранении", () => {
    const onChange = vi.fn();
    render(
      <EditableField label="Имя" value="Иван Иванов" onChange={onChange} />,
    );

    const editButton = screen.getByLabelText("Редактировать Имя");
    fireEvent.click(editButton);

    const input = screen.getByLabelText(
      "Редактирование Имя",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  Петр Петров  " } });

    const saveButton = screen.getByLabelText("Сохранить изменения");
    fireEvent.click(saveButton);

    expect(onChange).toHaveBeenCalledWith("Петр Петров");
  });
});
