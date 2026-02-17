import { afterEach, describe, expect, it, vi } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import type { CandidateData } from "../../shared/types";
import { DataPanel } from "./data-panel";

const mockCandidateData: CandidateData = {
  platform: "LinkedIn",
  profileUrl: "https://linkedin.com/in/test",
  basicInfo: {
    fullName: "Иван Иванов",
    currentPosition: "Senior Developer",
    location: "Москва, Россия",
    photoUrl: "https://example.com/photo.jpg",
  },
  experience: [
    {
      position: "Senior Developer",
      company: "Tech Corp",
      startDate: "Январь 2020",
      endDate: null,
      description: "Разработка веб-приложений",
    },
  ],
  education: [
    {
      institution: "МГУ",
      degree: "Бакалавр",
      fieldOfStudy: "Информатика",
      startDate: "2015",
      endDate: "2019",
    },
  ],
  skills: ["JavaScript", "React", "TypeScript"],
  contacts: {
    email: "ivan@example.com",
    phone: "+7 999 123 45 67",
    socialLinks: ["https://github.com/ivan"],
  },
  extractedAt: new Date("2024-01-01T12:00:00Z"),
};

describe("DataPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("должен возвращать null если данные отсутствуют", () => {
    const { container } = render(
      <DataPanel
        data={null}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("должен отображать заголовок с платформой и датой", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    expect(screen.getByText("Данные кандидата")).toBeDefined();
    expect(screen.getByText(/LinkedIn/)).toBeDefined();
  });

  it("должен отображать основную информацию", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    expect(screen.getByText("Иван Иванов")).toBeDefined();
    expect(screen.getAllByText("Senior Developer").length).toBeGreaterThan(0);
    expect(screen.getByText("Москва, Россия")).toBeDefined();
  });

  it("должен отображать фотографию профиля если она есть", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    const img = screen.getByAltText(
      "Фотография Иван Иванов",
    ) as HTMLImageElement;
    expect(img.src).toBe("https://example.com/photo.jpg");
  });

  it("должен отображать опыт работы", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    expect(screen.getByText("Опыт работы")).toBeDefined();
    expect(screen.getByText("Tech Corp")).toBeDefined();
  });

  it("должен отображать образование", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    expect(screen.getByText("Образование")).toBeDefined();
    expect(screen.getByText("МГУ")).toBeDefined();
  });

  it("должен отображать навыки", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    expect(screen.getByText("Навыки")).toBeDefined();
    expect(screen.getByText("JavaScript")).toBeDefined();
    expect(screen.getByText("React")).toBeDefined();
    expect(screen.getByText("TypeScript")).toBeDefined();
  });

  it("должен отображать контактную информацию", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    expect(screen.getByText("Контактная информация")).toBeDefined();
    const emailInput = screen.getByLabelText(
      "Электронная почта кандидата",
    ) as HTMLInputElement;
    expect(emailInput.value).toBe("ivan@example.com");
  });

  it("должен отображать кнопки экспорта", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    expect(
      screen.getByLabelText("Экспортировать данные в формате JSON"),
    ).toBeDefined();
    expect(
      screen.getByLabelText("Скопировать данные в буфер обмена"),
    ).toBeDefined();
  });

  it("должен отображать кнопку импорта когда API настроен", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={true}
      />,
    );

    expect(
      screen.getByLabelText("Импортировать кандидата в систему"),
    ).toBeDefined();
  });

  it("не должен отображать кнопку импорта когда API не настроен", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    expect(
      screen.queryByLabelText("Импортировать кандидата в систему"),
    ).toBeNull();
  });

  it("должен вызывать onExport при клике на кнопку экспорта JSON", async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={onExport}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    const exportButton = screen.getByLabelText(
      "Экспортировать данные в формате JSON",
    );
    fireEvent.click(exportButton);

    expect(onExport).toHaveBeenCalledWith("json");
  });

  it("должен вызывать onExport при клике на кнопку копирования", async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={onExport}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    const copyButton = screen.getByLabelText(
      "Скопировать данные в буфер обмена",
    );
    fireEvent.click(copyButton);

    expect(onExport).toHaveBeenCalledWith("clipboard");
  });

  it("должен вызывать onImportToSystem при клике на кнопку импорта", () => {
    const onImportToSystem = vi.fn();
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={onImportToSystem}
        apiConfigured={true}
      />,
    );

    const importButton = screen.getByLabelText(
      "Импортировать кандидата в систему",
    );
    fireEvent.click(importButton);

    expect(onImportToSystem).toHaveBeenCalled();
  });

  it("должен отображать состояние загрузки при импорте", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={true}
        isImporting={true}
      />,
    );

    const importButton = screen.getByLabelText(
      "Импортировать кандидата в систему",
    ) as HTMLButtonElement;
    expect(importButton.textContent).toBe("Импорт…");
    expect(importButton.disabled).toBe(true);
  });

  it("должен вызывать onEdit при изменении поля", () => {
    const onEdit = vi.fn();
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={onEdit}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    const editButton = screen.getByLabelText("Редактировать Полное имя");
    fireEvent.click(editButton);

    const input = screen.getByLabelText(
      "Редактирование Полное имя",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Петр Петров" } });

    const saveButton = screen.getByLabelText("Сохранить изменения");
    fireEvent.click(saveButton);

    expect(onEdit).toHaveBeenCalledWith("basicInfo.fullName", "Петр Петров");
  });

  it("должен иметь правильные ARIA атрибуты", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={false}
      />,
    );

    const region = screen.getByRole("region", { name: "Данные кандидата" });
    expect(region).toBeDefined();
  });

  it("должен поддерживать навигацию с клавиатуры", () => {
    render(
      <DataPanel
        data={mockCandidateData}
        onEdit={vi.fn()}
        onExport={vi.fn()}
        onImportToSystem={vi.fn()}
        apiConfigured={true}
      />,
    );

    const exportButton = screen.getByLabelText(
      "Экспортировать данные в формате JSON",
    );
    exportButton.focus();
    expect(document.activeElement).toBe(exportButton);
  });
});
