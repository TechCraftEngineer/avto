import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ResponseActionButtons } from "./response-action-buttons";

const mockOnRefreshDialogOpen = mock(() => {});
const mockOnSyncArchivedDialogOpen = mock(() => {});
const mockOnReanalyzeDialogOpen = mock(() => {});
const mockOnAnalyzeNewDialogOpen = mock(() => {});

beforeEach(() => {
  mockOnRefreshDialogOpen.mockClear();
  mockOnSyncArchivedDialogOpen.mockClear();
  mockOnReanalyzeDialogOpen.mockClear();
  mockOnAnalyzeNewDialogOpen.mockClear();
});

describe("ResponseActionButtons", () => {
  describe("для HH архивной вакансии (isArchivedPublication=true)", () => {
    it("должен отображать кнопку 'Загрузить архивные отклики'", () => {
      const { container } = render(
        <ResponseActionButtons
          isRefreshing={false}
          isSyncingArchived={false}
          isReanalyzing={false}
          onRefreshDialogOpen={mockOnRefreshDialogOpen}
          onSyncArchivedDialogOpen={mockOnSyncArchivedDialogOpen}
          onReanalyzeDialogOpen={mockOnReanalyzeDialogOpen}
          onAnalyzeNewDialogOpen={mockOnAnalyzeNewDialogOpen}
          isHHVacancy={true}
          isArchivedPublication={true}
        />,
      );

      expect(
        within(container).getByRole("button", {
          name: /Загрузить архивные отклики/i,
        }),
      ).toBeDefined();
    });

    it("должен отображать 'Загрузка...' при isSyncingArchived=true", () => {
      const { container } = render(
        <ResponseActionButtons
          isRefreshing={false}
          isSyncingArchived={true}
          isReanalyzing={false}
          onRefreshDialogOpen={mockOnRefreshDialogOpen}
          onSyncArchivedDialogOpen={mockOnSyncArchivedDialogOpen}
          onReanalyzeDialogOpen={mockOnReanalyzeDialogOpen}
          onAnalyzeNewDialogOpen={mockOnAnalyzeNewDialogOpen}
          isHHVacancy={true}
          isArchivedPublication={true}
        />,
      );

      expect(within(container).getByText("Загрузка...")).toBeDefined();
    });

    it("должен вызывать onSyncArchivedDialogOpen при клике на кнопку загрузки архивных", () => {
      const { container } = render(
        <ResponseActionButtons
          isRefreshing={false}
          isSyncingArchived={false}
          isReanalyzing={false}
          onRefreshDialogOpen={mockOnRefreshDialogOpen}
          onSyncArchivedDialogOpen={mockOnSyncArchivedDialogOpen}
          onReanalyzeDialogOpen={mockOnReanalyzeDialogOpen}
          onAnalyzeNewDialogOpen={mockOnAnalyzeNewDialogOpen}
          isHHVacancy={true}
          isArchivedPublication={true}
        />,
      );

      const button = within(container).getByRole("button", {
        name: /Загрузить архивные отклики/i,
      });
      fireEvent.click(button);

      expect(mockOnSyncArchivedDialogOpen).toHaveBeenCalledTimes(1);
    });

    it("должен отключать кнопку при isSyncingArchived=true", () => {
      const { container } = render(
        <ResponseActionButtons
          isRefreshing={false}
          isSyncingArchived={true}
          isReanalyzing={false}
          onRefreshDialogOpen={mockOnRefreshDialogOpen}
          onSyncArchivedDialogOpen={mockOnSyncArchivedDialogOpen}
          onReanalyzeDialogOpen={mockOnReanalyzeDialogOpen}
          onAnalyzeNewDialogOpen={mockOnAnalyzeNewDialogOpen}
          isHHVacancy={true}
          isArchivedPublication={true}
        />,
      );

      const button = within(container).getByRole("button", {
        name: /Загрузка\.\.\./i,
      });
      expect(button).toHaveProperty("disabled", true);
    });
  });

  describe("для HH активной вакансии (isArchivedPublication=false)", () => {
    it("должен отображать кнопку 'Обновить отклики' вместо 'Загрузить архивные'", () => {
      const { container } = render(
        <ResponseActionButtons
          isRefreshing={false}
          isSyncingArchived={false}
          isReanalyzing={false}
          onRefreshDialogOpen={mockOnRefreshDialogOpen}
          onSyncArchivedDialogOpen={mockOnSyncArchivedDialogOpen}
          onReanalyzeDialogOpen={mockOnReanalyzeDialogOpen}
          onAnalyzeNewDialogOpen={mockOnAnalyzeNewDialogOpen}
          isHHVacancy={true}
          isArchivedPublication={false}
        />,
      );

      expect(
        within(container).getByRole("button", { name: /Обновить отклики/i }),
      ).toBeDefined();
      expect(within(container).queryByText(/Загрузить архивные отклики/i)).toBeNull();
    });
  });
});
