"use client";

import { RefreshStatusIndicator } from "../../refresh-status-indicator";
import { useVacancyOperation } from "./context/vacancy-responses-context";

/**
 * Компонент для отображения индикаторов статуса всех операций
 */
export function StatusIndicators() {
  const refreshOp = useVacancyOperation("refresh");
  const archivedOp = useVacancyOperation("archived");
  const screenNewOp = useVacancyOperation("screenNew");
  const screenAllOp = useVacancyOperation("screenAll");

  return (
    <div className="space-y-2">
      <RefreshStatusIndicator
        vacancyId={refreshOp.vacancyId}
        workspaceId={refreshOp.workspaceId}
        mode="refresh"
        showConfirmation={refreshOp.showConfirmation}
        onConfirmationClose={refreshOp.closeConfirmation}
        onConfirm={refreshOp.execute}
      />
      <RefreshStatusIndicator
        vacancyId={archivedOp.vacancyId}
        workspaceId={archivedOp.workspaceId}
        mode="archived"
        showConfirmation={archivedOp.showConfirmation}
        onConfirmationClose={archivedOp.closeConfirmation}
        onConfirm={archivedOp.execute}
      />
      <RefreshStatusIndicator
        vacancyId={screenNewOp.vacancyId}
        workspaceId={screenNewOp.workspaceId}
        mode="screening"
        showConfirmation={screenNewOp.showConfirmation}
        onConfirmationClose={screenNewOp.closeConfirmation}
        onConfirm={screenNewOp.execute}
        message={screenNewOp.message}
        progress={screenNewOp.progress}
      />
      <RefreshStatusIndicator
        vacancyId={screenAllOp.vacancyId}
        workspaceId={screenAllOp.workspaceId}
        mode="analyze"
        showConfirmation={screenAllOp.showConfirmation}
        onConfirmationClose={screenAllOp.closeConfirmation}
        onConfirm={screenAllOp.execute}
        message={screenAllOp.message}
        progress={screenAllOp.progress}
      />
    </div>
  );
}
