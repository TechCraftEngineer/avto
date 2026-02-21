/**
 * Скрипт для выполнения fetch в page context (с куками пользователя)
 * Инжектируется через <script src="..."> для обхода CSP
 *
 * Параметры передаются через data-атрибуты:
 * - data-fetch-id: уникальный ID запроса
 * - data-fetch-url: URL для загрузки
 * - data-fetch-type: тип запроса (vacancy | resume | image)
 */

(() => {
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
    type === "vacancy"
      ? "HH_VACANCY_HTML_RESULT"
      : type === "resume"
        ? "HH_RESUME_HTML_RESULT"
        : type === "resume-text"
          ? "HH_RESUME_TEXT_HTML_RESULT"
          : type === "image"
            ? "HH_IMAGE_RESULT"
            : "HH_RESUME_HTML_RESULT";

  if (type === "image") {
    fetch(url, { credentials: "include" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const contentType =
          response.headers.get("content-type")?.split(";")[0]?.trim() ||
          "image/jpeg";
        return response
          .arrayBuffer()
          .then((buf) => ({ buffer: buf, contentType }));
      })
      .then(({ buffer, contentType }) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i] ?? 0);
        }
        const base64 = btoa(binary);
        window.postMessage({ type: messageType, id, base64, contentType }, "*");
      })
      .catch((err) => {
        window.postMessage({ type: messageType, id, error: err.message }, "*");
      });
    return;
  }

  fetch(url, { credentials: "include" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    })
    .then((html) => {
      window.postMessage({ type: messageType, id, html }, "*");
    })
    .catch((err) => {
      window.postMessage({ type: messageType, id, error: err.message }, "*");
    });
})();
