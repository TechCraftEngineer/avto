import { RefreshDialog } from "./refresh-dialog";
import { ScreeningDialog } from "./screening-dialog";
import { SyncArchivedDialog } from "./sync-archived-dialog";
import type { RefreshState } from "./use-refresh-state";
import type { ScreeningState } from "./use-screening-state";
import type { SyncArchivedState } from "./use-sync-archived-state";
import type { RefreshAllResumesState } from "./use-refresh-all-resumes-state";

interface ResponseDialogsProps {
  totalResponses: number;
  refreshState: RefreshState;
  screenNewState: ScreeningState;
  screenAllState: ScreeningState;
  syncArchivedState: SyncArchivedState;
  refreshAllResumesState: RefreshAllResumesState;
}

function getPluralForm(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}

export function ResponseDialogs({
  totalResponses,
  refreshState,
  screenNewState,
  screenAllState,
  syncArchivedState,
  refreshAllResumesState,
}: ResponseDialogsProps) {
  return (
    <>
      <RefreshDialog
        open={refreshState.dialogOpen}
        status={refreshState.status}
        message={refreshState.message}
        error={refreshState.error}
        onOpenChange={(open) => {
          if (!open) refreshState.handleDialogClose();
          else refreshState.setDialogOpen(true);
        }}
        onConfirm={refreshState.handleRefreshClick}
        onClose={refreshState.handleDialogClose}
      />

      <ScreeningDialog
        open={screenNewState.dialogOpen}
        title="Оценка новых откликов"
        description="Будет запущен процесс оценки новых откликов (без скрининга). Процесс будет выполняться в фоновом режиме, и результаты появятся в таблице автоматически."
        status={screenNewState.status}
        message={screenNewState.message}
        error={screenNewState.error}
        progress={screenNewState.progress}
        onOpenChange={(open) => {
          if (!open && screenNewState.status !== "loading") {
            screenNewState.handleDialogClose();
          }
        }}
        onConfirm={screenNewState.handleClick}
        onClose={screenNewState.handleDialogClose}
      />

      <ScreeningDialog
        open={screenAllState.dialogOpen}
        title="Оценка всех откликов"
        description={`Вы собираетесь запустить оценку для ${totalResponses} ${getPluralForm(
          totalResponses,
          "отклик",
          "отклика",
          "откликов",
        )}. Процесс будет выполняться в фоновом режиме, и результаты появятся в таблице автоматически.`}
        status={screenAllState.status}
        message={screenAllState.message}
        error={screenAllState.error}
        progress={screenAllState.progress}
        onOpenChange={(open) => {
          if (!open && screenAllState.status !== "loading") {
            screenAllState.handleDialogClose();
          }
        }}
        onConfirm={screenAllState.handleClick}
        onClose={screenAllState.handleDialogClose}
      />

      <SyncArchivedDialog
        open={syncArchivedState.dialogOpen}
        status={syncArchivedState.status}
        message={syncArchivedState.message}
        error={syncArchivedState.error}
        syncedCount={syncArchivedState.syncedCount}
        newCount={syncArchivedState.newCount}
        vacancyTitle={syncArchivedState.vacancyTitle}
        onOpenChange={(open) => {
          if (!open && syncArchivedState.status !== "loading") {
            syncArchivedState.handleDialogClose();
          }
        }}
        onConfirm={syncArchivedState.handleClick}
        onClose={syncArchivedState.handleDialogClose}
      />

      <ScreeningDialog
        open={refreshAllResumesState.dialogOpen}
        title="Обновление резюме у всех откликов"
        description={`Вы собираетесь запустить обновление резюме для ${totalResponses} ${getPluralForm(
          totalResponses,
          "отклик",
          "отклика",
          "откликов",
        )}. Процесс будет выполняться в фоновом режиме, и результаты появятся в таблице автоматически.`}
        status={refreshAllResumesState.status}
        message={refreshAllResumesState.message}
        error={refreshAllResumesState.error}
        progress={refreshAllResumesState.progress}
        onOpenChange={(open) => {
          if (!open) {
            refreshAllResumesState.handleDialogClose();
          }
        }}
        onConfirm={refreshAllResumesState.handleClick}
        onClose={refreshAllResumesState.handleDialogClose}
      />
    </>
  );
}
