/**
 * Скрипт для выполнения fetch в page context (с куками пользователя)
 * Инжектируется через <script src="..."> для обхода CSP
 *
 * Параметры передаются через data-атрибуты:
 * - data-fetch-id: уникальный ID запроса
 * - data-fetch-url: URL для загрузки
 * - data-fetch-type: тип запроса (vacancy или resume)
 */

(() => {
  // Получаем параметры из текущего script элемента
  const currentScript = document.currentScript;
  if (!currentScript) {
    console.error("[fetch-page-context] currentScript не найден");
    return;
  }

  const id = currentScript.dataset.fetchId;
  const url = currentScript.dataset.fetchUrl;
  const type = currentScript.dataset.fetchType;

  if (!id || !url || !type) {
    console.error("[fetch-page-context] Отсутствуют обязательные параметры", {
      id,
      url,
      type,
    });
    return;
  }

  const messageType =
    type === "vacancy" ? "HH_VACANCY_HTML_RESULT" : "HH_RESUME_HTML_RESULT";

  // Выполняем fetch с куками
  fetch(url, { credentials: "include" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    })
    .then((html) => {
      window.postMessage(
        {
          type: messageType,
          id,
          html,
        },
        "*",
      );
    })
    .catch((err) => {
      window.postMessage(
        {
          type: messageType,
          id,
          error: err.message,
        },
        "*",
      );
    });
})();
