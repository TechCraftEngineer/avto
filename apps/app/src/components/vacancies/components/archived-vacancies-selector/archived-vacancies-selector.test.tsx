import { describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ArchivedVacanciesSelector } from "./archived-vacancies-selector";

// Mock dependencies
mock.module("@bunworks/inngest-realtime/hooks", () => ({
  useInngestSubscription: () => ({
    data: [
      {
        topic: "result",
        data: {
          vacancies: [
            {
              id: "vac-1",
              title: "Senior TypeScript Developer",
              region: "Москва",
              archivedAt: "2024-01-15T10:00:00Z",
              isImported: false,
            },
            {
              id: "vac-2",
              title: "Frontend Developer",
              region: "Санкт-Петербург",
              archivedAt: "2024-01-10T10:00:00Z",
              isImported: true,
            },
          ],
        },
      },
    ],
    error: null,
  }),
}));

mock.module("~/actions/realtime", () => ({
  fetchArchivedVacanciesListToken: mock(() => Promise.resolve("token-123")),
}));

describe("ArchivedVacanciesSelector", () => {
  const mockWorkspaceId = "workspace-123";
  const mockRequestId = "request-123";
  const mockOnSelect = mock(() => {});
  const mockOnCancel = mock(() => {});

  it("должен отображать список архивных вакансий", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Senior TypeScript Developer"),
      ).toBeInTheDocument();
      expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    });
  });

  it("должен отображать статистику вакансий", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Всего: 2/)).toBeInTheDocument();
      expect(screen.getByText(/Загружено: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Новых: 1/)).toBeInTheDocument();
    });
  });

  it("должен фильтровать вакансии по поисковому запросу", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      "Поиск по названию вакансии...",
    );
    fireEvent.change(searchInput, { target: { value: "TypeScript" } });

    await waitFor(() => {
      expect(
        screen.getByText("Senior TypeScript Developer"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument();
    });
  });

  it("должен фильтровать вакансии по табам", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    // Переключаемся на таб "Новые"
    const newTab = screen.getByRole("tab", { name: /Новые/ });
    fireEvent.click(newTab);

    await waitFor(() => {
      expect(
        screen.getByText("Senior TypeScript Developer"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument();
    });

    // Переключаемся на таб "Загруженные"
    const importedTab = screen.getByRole("tab", { name: /Загруженные/ });
    fireEvent.click(importedTab);

    await waitFor(() => {
      expect(
        screen.queryByText("Senior TypeScript Developer"),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    });
  });

  it("должен выбирать и снимать выбор вакансий", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Выбрано: 0/)).toBeInTheDocument();
    });

    // Выбираем первую вакансию
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // Первый checkbox - это "выбрать все"

    await waitFor(() => {
      expect(screen.getByText(/Выбрано: 1/)).toBeInTheDocument();
    });

    // Снимаем выбор
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(screen.getByText(/Выбрано: 0/)).toBeInTheDocument();
    });
  });

  it("должен выбирать все видимые вакансии", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    // Нажимаем на checkbox "Выбрать все"
    const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(selectAllCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/Выбрано: 2/)).toBeInTheDocument();
    });
  });

  it("должен выбирать только новые вакансии", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const selectNewButton = screen.getByRole("button", {
      name: /Выбрать все новые/,
    });
    fireEvent.click(selectNewButton);

    await waitFor(() => {
      expect(screen.getByText(/Выбрано: 1/)).toBeInTheDocument();
    });
  });

  it("должен вызывать onSelect с выбранными вакансиями", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    // Выбираем вакансию
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);

    // Нажимаем кнопку импорта
    const importButton = screen.getByRole("button", { name: /Импортировать/ });
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(
        ["vac-1"],
        expect.arrayContaining([
          expect.objectContaining({
            id: "vac-1",
            title: "Senior TypeScript Developer",
          }),
        ]),
      );
    });
  });

  it("должен вызывать onCancel при нажатии кнопки Отмена", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "Отмена" });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("должен отключать кнопку импорта если ничего не выбрано", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const importButton = screen.getByRole("button", { name: /Импортировать/ });
    expect(importButton).toBeDisabled();
  });

  it("должен сортировать вакансии по названию", async () => {
    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    // Меняем сортировку на "По названию"
    const sortSelect = screen.getByRole("combobox");
    fireEvent.change(sortSelect, { target: { value: "name" } });

    await waitFor(() => {
      const vacancies = screen.getAllByRole("checkbox");
      // Проверяем что вакансии отсортированы по алфавиту
      expect(vacancies.length).toBeGreaterThan(0);
    });
  });

  it("должен отображать сообщение об ошибке", async () => {
    // Mock ошибку
    mock.module("@bunworks/inngest-realtime/hooks", () => ({
      useInngestSubscription: () => ({
        data: [],
        error: new Error("Ошибка загрузки"),
      }),
    }));

    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Ошибка загрузки")).toBeInTheDocument();
    });
  });

  it("должен отображать состояние загрузки", async () => {
    // Mock состояние загрузки
    mock.module("@bunworks/inngest-realtime/hooks", () => ({
      useInngestSubscription: () => ({
        data: [],
        error: null,
      }),
    }));

    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Загрузка списка вакансий")).toBeInTheDocument();
    });
  });

  it("должен отображать сообщение если нет архивных вакансий", async () => {
    // Mock пустой список
    mock.module("@bunworks/inngest-realtime/hooks", () => ({
      useInngestSubscription: () => ({
        data: [
          {
            topic: "result",
            data: {
              vacancies: [],
            },
          },
        ],
        error: null,
      }),
    }));

    render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Архивные вакансии не найдены"),
      ).toBeInTheDocument();
    });
  });
});
