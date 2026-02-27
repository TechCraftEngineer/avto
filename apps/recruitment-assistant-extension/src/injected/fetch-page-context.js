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
            : type === "pdf"
              ? "HH_PDF_RESULT"
              : "HH_RESUME_HTML_RESULT";

  // Для image и pdf — страница HH может подменять fetch и XMLHttpRequest.
  // Пробуем нативный XHR из iframe, при ошибке — fetch.
  if (type === "image" || type === "pdf") {
    const defaultContentType =
      type === "pdf" ? "application/pdf" : "image/jpeg";
    const sendResult = (base64, contentType) =>
      window.postMessage({ type: messageType, id, base64, contentType }, "*");
    const sendError = (err) =>
      window.postMessage({ type: messageType, id, error: err }, "*");

    let useXHR = false;
    try {
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "display:none;position:absolute;width:0;height:0;";
      iframe.src = "about:blank";
      document.documentElement.appendChild(iframe);
      const XHR = iframe.contentWindow?.XMLHttpRequest;
      iframe.remove();
      if (typeof XHR === "function") {
        const xhr = new XHR();
        xhr.open("GET", url, true);
        xhr.withCredentials = true;
        xhr.responseType = "arraybuffer";
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            const msg = xhr.statusText
              ? `Ошибка HTTP ${xhr.status}: ${xhr.statusText}`
              : `Ошибка HTTP ${xhr.status}`;
            sendError(msg);
            return;
          }
          const ct =
            xhr.getResponseHeader("content-type")?.split(";")[0]?.trim() ||
            defaultContentType;
          const buf = xhr.response;
          const bytes = new Uint8Array(buf);
          let b = "";
          for (let i = 0; i < bytes.byteLength; i++)
            b += String.fromCharCode(bytes[i] ?? 0);
          sendResult(btoa(b), ct);
        };
        xhr.onerror = () => sendError("Ошибка загрузки");
        xhr.send();
        useXHR = true;
      }
    } catch (_) {}

    if (useXHR) return;
  }

  if (type === "image" || type === "pdf") {
    const defaultContentType =
      type === "pdf" ? "application/pdf" : "image/jpeg";
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          const statusText = res.statusText || "";
          throw new Error(
            statusText
              ? `Ошибка HTTP ${res.status}: ${statusText}`
              : `Ошибка HTTP ${res.status}`,
          );
        }
        return res.arrayBuffer().then((buf) => ({
          buffer: buf,
          contentType:
            res.headers.get("content-type")?.split(";")[0]?.trim() ||
            defaultContentType,
        }));
      })
      .then(({ buffer, contentType }) => {
        const bytes = new Uint8Array(buffer);
        let b = "";
        for (let i = 0; i < bytes.byteLength; i++)
          b += String.fromCharCode(bytes[i] ?? 0);
        window.postMessage(
          { type: messageType, id, base64: btoa(b), contentType },
          "*",
        );
      })
      .catch((e) =>
        window.postMessage({ type: messageType, id, error: e.message }, "*"),
      );
    return;
  }

  fetch(url, { credentials: "include" })
    .then((response) => {
      if (!response.ok) {
        const st = response.statusText || "";
        throw new Error(
          st
            ? `Ошибка HTTP ${response.status}: ${st}`
            : `Ошибка HTTP ${response.status}`,
        );
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
