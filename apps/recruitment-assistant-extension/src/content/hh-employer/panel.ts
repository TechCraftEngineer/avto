/**
 * UI панели импорта на страницах HH employer
 * Кнопки находятся только в popup — здесь остаются чекбоксы для выбора
 */

import { detectHHEmployerPageType } from "../../parsers/hh-employer";
import { runNativeCheckboxBinding } from "./checkboxes";

export function initHHEmployerContentScript(): void {
  const pageType = detectHHEmployerPageType();
  if (pageType === "unknown") return;

  if (pageType !== "vacancy-responses") {
    runNativeCheckboxBinding(pageType, () => {
      // Обновление счётчика в popup — через chrome.storage.onChanged
    });
  }
}
