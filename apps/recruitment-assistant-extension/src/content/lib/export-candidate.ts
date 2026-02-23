/**
 * Экспорт данных кандидата (JSON-файл или буфер обмена)
 */

import type { CandidateData } from "../../shared/types";
import { showNotification } from "./notifications";

export type ExportFormat = "json" | "clipboard";

export async function exportCandidateData(
  data: CandidateData,
  format: ExportFormat,
): Promise<void> {
  const json = JSON.stringify(data, null, 2);

  if (format === "json") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidate-${data.basicInfo.fullName.replace(/\s+/g, "-") || "export"}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification({ type: "success", message: "Файл JSON сохранён" });
  } else {
    await navigator.clipboard.writeText(json);
    showNotification({
      type: "success",
      message: "Данные скопированы в буфер обмена",
    });
  }
}
