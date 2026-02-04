import { ScreeningDialog } from "./screening-dialog";
import type { ScreeningState } from "./use-screening-state";

interface ResponseDialogsProps {
  totalResponses: number;
  screenNewState: ScreeningState;
  screenAllState: ScreeningState;
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
  screenNewState,
  screenAllState,
}: ResponseDialogsProps) {
  return (
    <>
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
    </>
  );
}
