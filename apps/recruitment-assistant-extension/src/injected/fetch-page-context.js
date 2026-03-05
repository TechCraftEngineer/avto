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
  const PHOTO_FETCH_DEBUG =
    typeof window !== "undefined" &&
    window.__RECRUITMENT_ASSISTANT_DEBUG__ === true;
  const MAX_STATUS_TEXT_LENGTH = 100;
  const SAFE_CHAR_REGEX = /[^\x20-\x7E\u0400-\u04FF]/g;
  const ANGLE_BRACKET_REGEX = /[<>]/g;

  const sanitizeStatusText = (text) => {
    if (!text || typeof text !== "string") return "";
    return text
      .trim()
      .replace(SAFE_CHAR_REGEX, "")
      .replace(ANGLE_BRACKET_REGEX, "")
      .slice(0, MAX_STATUS_TEXT_LENGTH);
  };

  const formatHttpError = (status, statusText) => {
    const safe = sanitizeStatusText(statusText);
    return safe ? `Ошибка HTTP ${status}: ${safe}` : `Ошибка HTTP ${status}`;
  };

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
    const isPdfRequest = type === "pdf" || url?.toLowerCase().endsWith(".pdf");
    const sendResult = (base64, contentType) => {
      if (PHOTO_FETCH_DEBUG) {
        console.warn("[Photo Fetch] успех", {
          url: url?.slice(0, 70),
          contentType,
          len: base64?.length,
        });
      }
      window.postMessage({ type: messageType, id, base64, contentType }, "*");
    };
    const sendError = (err) => {
      if (PHOTO_FETCH_DEBUG) {
        console.warn("[Photo Fetch] ошибка", { url: url?.slice(0, 70), err });
      }
      window.postMessage({ type: messageType, id, error: err }, "*");
    };

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
        xhr.withCredentials = isPdfRequest; // PDF может требовать cookies
        xhr.responseType = "arraybuffer";
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            sendError(formatHttpError(xhr.status, xhr.statusText));
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
    const isPdfRequest = type === "pdf" || url?.toLowerCase().endsWith(".pdf");
    if (PHOTO_FETCH_DEBUG) {
      console.warn("[Photo Fetch] fetch() запущен", { url: url?.slice(0, 70) });
    }
    fetch(url, { credentials: isPdfRequest ? "include" : "omit" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(formatHttpError(res.status, res.statusText || ""));
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
        if (PHOTO_FETCH_DEBUG) {
          console.warn("[Photo Fetch] fetch() успех", {
            contentType,
            size: buffer.byteLength,
          });
        }
        window.postMessage(
          { type: messageType, id, base64: btoa(b), contentType },
          "*",
        );
      })
      .catch((e) => {
        if (PHOTO_FETCH_DEBUG) {
          console.warn("[Photo Fetch] fetch() ошибка", e.message);
        }
        window.postMessage({ type: messageType, id, error: e.message }, "*");
      });
    return;
  }

  fetch(url, { credentials: "include" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          formatHttpError(response.status, response.statusText || ""),
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
