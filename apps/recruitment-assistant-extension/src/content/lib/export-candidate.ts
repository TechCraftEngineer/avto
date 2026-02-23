/**
 * Экспорт данных кандидата в буфер обмена
 */

import type { CandidateData } from "../../shared/types";
import { showNotification } from "./notifications";

export async function exportCandidateData(data: CandidateData): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await navigator.clipboard.writeText(json);
  showNotification({
    type: "success",
    message: "Данные скопированы в буфер обмена",
  });
}
