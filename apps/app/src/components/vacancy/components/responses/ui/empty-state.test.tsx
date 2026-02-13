import { beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, within } from "@testing-library/react";
import { EmptyState } from "./empty-state";

const mockOnSyncArchivedDialogOpen = mock(() => {});

beforeEach(() => {
  mockOnSyncArchivedDialogOpen.mockClear();
});

function renderEmptyState(props: React.ComponentProps<typeof EmptyState>) {
  return render(
    <table>
      <tbody>
        <EmptyState {...props} />
      </tbody>
    </table>,
  );
}

describe("EmptyState", () => {
  describe("кнопка загрузки архивных откликов", () => {
    it("должен показывать кнопку для архивной HH вакансии без откликов с externalId", () => {
      const result = renderEmptyState({
        hasResponses: false,
        colSpan: 5,
        source: "HH",
        externalId: "hh-123",
        isActive: false,
        onSyncArchivedDialogOpen: mockOnSyncArchivedDialogOpen,
      });

      const w = within(result.container);
      const button = w.getByRole("button", {
        name: /Загрузить архивные отклики/i,
      });
      expect(button).toBeDefined();
    });

    it("не должен показывать кнопку для активной вакансии", () => {
      const result = renderEmptyState({
        hasResponses: false,
        colSpan: 5,
        source: "HH",
        externalId: "hh-123",
        isActive: true,
        onSyncArchivedDialogOpen: mockOnSyncArchivedDialogOpen,
      });

      expect(within(result.container).queryByRole("button")).toBeNull();
    });

    it("не должен показывать кнопку без onSyncArchivedDialogOpen", () => {
      const result = renderEmptyState({
        hasResponses: false,
        colSpan: 5,
        source: "HH",
        externalId: "hh-123",
        isActive: false,
      });

      expect(within(result.container).queryByRole("button")).toBeNull();
    });

    it("не должен показывать кнопку без externalId", () => {
      const result = renderEmptyState({
        hasResponses: false,
        colSpan: 5,
        source: "HH",
        externalId: null,
        isActive: false,
        onSyncArchivedDialogOpen: mockOnSyncArchivedDialogOpen,
      });

      expect(within(result.container).queryByRole("button")).toBeNull();
    });

    it("не должен показывать кнопку для не-HH источника", () => {
      const result = renderEmptyState({
        hasResponses: false,
        colSpan: 5,
        source: "SuperJob",
        externalId: "sj-123",
        isActive: false,
        onSyncArchivedDialogOpen: mockOnSyncArchivedDialogOpen,
      });

      expect(within(result.container).queryByRole("button")).toBeNull();
    });

    it("должен вызывать onSyncArchivedDialogOpen при клике", () => {
      const result = renderEmptyState({
        hasResponses: false,
        colSpan: 5,
        source: "HH",
        externalId: "hh-123",
        isActive: false,
        onSyncArchivedDialogOpen: mockOnSyncArchivedDialogOpen,
      });

      const button = within(result.container).getByRole("button", {
        name: /Загрузить архивные отклики/i,
      });
      fireEvent.click(button);

      expect(mockOnSyncArchivedDialogOpen).toHaveBeenCalledTimes(1);
    });

    it("должен отключать кнопку при isSyncingArchived=true", () => {
      const result = renderEmptyState({
        hasResponses: false,
        colSpan: 5,
        source: "HH",
        externalId: "hh-123",
        isActive: false,
        onSyncArchivedDialogOpen: mockOnSyncArchivedDialogOpen,
        isSyncingArchived: true,
      });

      const button = within(result.container).getByRole("button", {
        name: /Загрузить архивные отклики/i,
      });
      expect(button).toHaveProperty("disabled", true);
    });

    it("должен показывать текст 'Отклики ещё не загружены' для архивной HH вакансии", () => {
      const result = renderEmptyState({
        hasResponses: false,
        colSpan: 5,
        source: "HH",
        externalId: "hh-123",
        isActive: false,
        onSyncArchivedDialogOpen: mockOnSyncArchivedDialogOpen,
      });

      expect(
        within(result.container).getByText("Отклики ещё не загружены"),
      ).toBeDefined();
    });
  });

  describe("общее поведение", () => {
    it("не должен рендериться при isLoading=true", () => {
      const { container } = render(
        <table>
          <tbody>
            <EmptyState
              hasResponses={false}
              colSpan={5}
              isLoading={true}
              source="HH"
              externalId="hh-123"
              isActive={false}
            />
          </tbody>
        </table>,
      );

      expect(within(container).queryByText(/Отклики ещё не загружены/i)).toBeNull();
      expect(within(container).queryByText(/Пока нет откликов/i)).toBeNull();
    });
  });
});
