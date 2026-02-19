import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockToken } from "~/test-utils/mock-token";
import { ArchivedVacanciesSelector } from "./archived-vacancies-selector";

// Mock dependencies
const mockUseInngestSubscription = mock(() => ({
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
}));

// Mock модулей перед каждым тестом
beforeEach(() => {
  mock.module("@bunworks/inngest-realtime/hooks", () => ({
    useInngestSubscription: mockUseInngestSubscription,
  }));
});

describe("ArchivedVacanciesSelector", () => {
  const mockWorkspaceId = "workspace-123";
  const mockRequestId = "request-123";
  const mockToken = createMockToken(
    `fetch-archived-list:${mockWorkspaceId}:${mockRequestId}`,
    ["progress", "result"],
  );
  const mockOnSelect = mock(() => {});
  const mockOnCancel = mock(() => {});

  it("должен отображать список архивных вакансий", async () => {
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    await waitFor(() => {
      expect(w.getByText("Senior TypeScript Developer")).toBeDefined();
      expect(w.getByText("Frontend Developer")).toBeDefined();
    });
  });

  it("должен отображать статистику вакансий", async () => {
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    await waitFor(() => {
      expect(w.getByText(/Всего: 2/)).toBeDefined();
      expect(w.getByText(/Загружено: 1/)).toBeDefined();
      expect(w.getByText(/Новых: 1/)).toBeDefined();
    });
  });

  it("должен фильтровать вакансии по поисковому запросу", async () => {
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    const searchInput = w.getByPlaceholderText("Поиск по названию вакансии...");
    fireEvent.change(searchInput, { target: { value: "TypeScript" } });

    await waitFor(() => {
      expect(w.getByText("Senior TypeScript Developer")).toBeDefined();
      expect(w.queryByText("Frontend Developer")).toBeNull();
    });
  });

  it("должен фильтровать вакансии по табам", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    await waitFor(() => {
      expect(w.getByText("Senior TypeScript Developer")).toBeDefined();
    });

    const newTab = w.getByRole("tab", { name: /Новые/ });
    await user.click(newTab);

    await waitFor(() => {
      expect(w.getByText("Senior TypeScript Developer")).toBeDefined();
      expect(w.queryByText("Frontend Developer")).toBeNull();
    });

    const importedTab = w.getByRole("tab", { name: /Загруженные/ });
    await user.click(importedTab);

    await waitFor(() => {
      expect(w.queryByText("Senior TypeScript Developer")).toBeNull();
      expect(w.getByText("Frontend Developer")).toBeDefined();
    });
  });

  it("должен выбирать и снимать выбор вакансий", async () => {
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    await waitFor(() => {
      expect(w.getByText(/Выбрано: 0/)).toBeDefined();
    });

    const checkboxes = w.getAllByRole("checkbox");
    const checkbox1 = checkboxes[1];
    if (checkbox1) {
      fireEvent.click(checkbox1);
    }

    await waitFor(() => {
      expect(w.getByText(/Выбрано: 1/)).toBeDefined();
    });

    if (checkbox1) {
      fireEvent.click(checkbox1);
    }

    await waitFor(() => {
      expect(w.getByText(/Выбрано: 0/)).toBeDefined();
    });
  });

  it("должен выбирать все видимые вакансии", async () => {
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    const checkboxes = w.getAllByRole("checkbox");
    const selectAllCheckbox = checkboxes[0];
    if (selectAllCheckbox) {
      fireEvent.click(selectAllCheckbox);
    }

    await waitFor(() => {
      expect(w.getByText(/Выбрано: 2/)).toBeDefined();
    });
  });

  it("должен выбирать только новые вакансии", async () => {
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    const selectNewButton = w.getByRole("button", {
      name: /Выбрать все новые/,
    });
    fireEvent.click(selectNewButton);

    await waitFor(() => {
      expect(w.getByText(/Выбрано: 1/)).toBeDefined();
    });
  });

  it("должен вызывать onSelect с выбранными вакансиями", async () => {
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    const checkboxes = w.getAllByRole("checkbox");
    const vacancyCheckbox = checkboxes[1];
    if (vacancyCheckbox) {
      fireEvent.click(vacancyCheckbox);
    }

    const importButton = w.getByRole("button", { name: /Импортировать/ });
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  it("должен вызывать onCancel при нажатии кнопки Отмена", async () => {
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    const cancelButton = w.getByRole("button", { name: "Отмена" });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("должен отключать кнопку импорта если ничего не выбрано", async () => {
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    const importButton = w.getByRole("button", { name: /Импортировать/ });
    expect(importButton.hasAttribute("disabled")).toBe(true);
  });

  it("должен сортировать вакансии по названию", async () => {
    const { container } = render(
      <ArchivedVacanciesSelector
        workspaceId={mockWorkspaceId}
        requestId={mockRequestId}
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    const w = within(container);
    const sortSelect = w.getByRole("combobox");
    fireEvent.change(sortSelect, { target: { value: "name" } });

    await waitFor(() => {
      const vacancies = w.getAllByRole("checkbox");
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
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Ошибка загрузки")).toBeDefined();
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
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Загрузка списка вакансий")).toBeDefined();
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
        token={mockToken}
        onSelect={mockOnSelect}
        onCancel={mockOnCancel}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Архивные вакансии не найдены")).toBeDefined();
    });
  });
});
