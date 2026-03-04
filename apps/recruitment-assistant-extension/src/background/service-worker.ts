/**
 * Background Service Worker для Recruitment Assistant Extension
 *
 * Обрабатывает сообщения от content script и проксирует API запросы
 * для обхода CORS ограничений.
 */

import type { ApiRequest, ApiResponse } from "../shared/types";

/**
 * Типы сообщений от content script / popup
 */
type MessageType =
  | "API_REQUEST"
  | "PING"
  | "EXECUTE_IMPORT_SELECTED_VACANCIES"
  | "EXECUTE_IMPORT_RESPONSES"
  | "EXECUTE_IMPORT_TO_SYSTEM"
  | "EXECUTE_CHECK_AND_SAVE_TO_GLOBAL"
  | "FETCH_RESUME_TEXT"
  | "FETCH_RESUME_PDF"
  | "FETCH_IMAGE"
  | "FETCH_CHATIK_CHATS"
  | "FETCH_CHATIK_SEARCH";

/**
 * Структура сообщения от content script / popup
 */
interface Message {
  type: MessageType;
  payload?:
    | ApiRequest
    | { tabId: number }
    | { tabId: number; vacancyId?: string; workspaceId?: string }
    | Record<string, unknown>;
}

/**
 * Логирование с временной меткой
 */
function log(message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  console.log(`[Service Worker ${timestamp}]`, message, data || "");
}

/**
 * Логирование ошибок
 */
function logError(message: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  console.error(`[Service Worker ${timestamp}] ОШИБКА:`, message, error);
}

const FETCH_TIMEOUT_MS = 10000;

/** Разрешённые хосты для API-запросов (защита от SSRF) */
const ALLOWED_HOSTS = [
  "app.avtonaim.qbsoft.ru",
  "ext-api.avtonaim.qbsoft.ru",
  "localhost",
  "127.0.0.1",
  ...(typeof process !== "undefined" && process.env?.NODE_ENV === "test"
    ? ["api.example.com"]
    : []),
] as const;

function isUrlAllowed(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

/**
 * Извлекает innerHTML div.resume из HTML (аналог cheerio $('div[class="resume"]').html())
 * Service Worker не имеет DOMParser — используем подсчёт вложенных div
 */
function extractDivResume(html: string): string | null {
  const openMatch = html.match(
    /<div[^>]*\bclass=["']resume(\s+[^"']*)?["'][^>]*>/i,
  );
  if (!openMatch) return null;
  const openTag = openMatch[0];
  const startIdx = html.indexOf(openTag) + openTag.length;
  let depth = 1;
  let i = startIdx;
  while (depth > 0 && i < html.length) {
    const nextClose = html.indexOf("</div>", i);
    if (nextClose === -1) break;
    const nextOpen = html.indexOf("<div", i);
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return html.slice(startIdx, nextClose).trim();
      }
      i = nextClose + 6;
    }
  }
  return null;
}

/**
 * Проверяет, что payload является валидным ApiRequest
 */
function isApiRequest(payload: unknown): payload is ApiRequest {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (typeof p.url !== "string" || !p.url) return false;
  const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  if (!validMethods.includes(p.method as string)) return false;
  return true;
}

/**
 * Проксирование API запроса для обхода CORS
 */
async function proxyApiRequest(request: ApiRequest): Promise<ApiResponse> {
  try {
    log("Проксирование API запроса", {
      url: request.url,
      method: request.method,
    });

    // Валидация URL
    if (!request.url || typeof request.url !== "string") {
      throw new Error("Некорректный URL запроса");
    }

    // Проверка протокола и whitelist хостов (защита от SSRF)
    const url = new URL(request.url);
    const isLocalhost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (!request.url.startsWith("https://") && !isLocalhost) {
      throw new Error("Разрешены только HTTPS запросы");
    }
    if (!isUrlAllowed(url)) {
      throw new Error("Домен не в списке разрешённых");
    }

    // Подготовка заголовков (Content-Type только для методов с телом)
    const headers: HeadersInit = { ...request.headers };
    if (request.body && ["POST", "PUT", "PATCH"].includes(request.method)) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    // Подготовка опций запроса
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Добавление тела запроса для POST/PUT/PATCH
    if (request.body && ["POST", "PUT", "PATCH"].includes(request.method)) {
      fetchOptions.body = JSON.stringify(request.body);
    }

    // Таймаут для fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    fetchOptions.signal = controller.signal;

    const response = await fetch(request.url, fetchOptions);
    clearTimeout(timeoutId);

    // Обработка ответа
    let data: unknown;
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      log("API запрос завершился с ошибкой", {
        status: response.status,
        statusText: response.statusText,
      });

      // Безопасное извлечение сообщения об ошибке (error — extension-api, message — типичный REST)
      const errorMessage =
        typeof data === "object" && data !== null
          ? "error" in data &&
            typeof (data as { error?: string }).error === "string"
            ? (data as { error: string }).error
            : "message" in data &&
                typeof (data as { message?: string }).message === "string"
              ? (data as { message: string }).message
              : response.statusText || "Ошибка запроса к API"
          : response.statusText || "Ошибка запроса к API";

      return {
        success: false,
        error: errorMessage,
        status: response.status,
        data,
      };
    }

    log("API запрос выполнен успешно", { status: response.status });

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    logError("Ошибка при выполнении API запроса", error);

    // Определение типа ошибки
    let errorMessage = "Не удалось выполнить запрос к API";

    if (error instanceof Error && error.name === "AbortError") {
      errorMessage =
        "Превышено время ожидания ответа от сервера. Попробуйте позже.";
    } else if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage =
        "Не удалось подключиться к серверу. Проверьте подключение к интернету.";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Типы ответов от service worker
 */
type ServiceWorkerResponse =
  | ApiResponse
  | { success: boolean; message?: string; error?: string }
  | { success: boolean; base64?: string; contentType?: string; error?: string }
  | { success: boolean; data?: unknown; error?: string }
  | { ok?: boolean; error?: string };

/**
 * Обработка сообщений от content script
 */
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: ServiceWorkerResponse) => void,
  ) => {
    log("Получено сообщение", { type: message.type, sender: sender.tab?.url });

    // Обработка разных типов сообщений
    switch (message.type) {
      case "API_REQUEST": {
        if (!isApiRequest(message.payload)) {
          sendResponse({
            success: false,
            error:
              "Некорректный формат запроса: ожидается объект с url и method",
          });
          return true;
        }

        const apiRequest = message.payload;

        proxyApiRequest(apiRequest)
          .then((response) => {
            sendResponse(response);
          })
          .catch((error) => {
            logError("Необработанная ошибка при проксировании", error);
            sendResponse({
              success: false,
              error: "Внутренняя ошибка при обработке запроса",
            });
          });

        // Возвращаем true, чтобы указать, что ответ будет отправлен асинхронно
        return true;
      }

      case "PING":
        // Простая проверка работоспособности
        log("Получен PING");
        sendResponse({ success: true, message: "pong" });
        return false;

      case "EXECUTE_IMPORT_SELECTED_VACANCIES": {
        const tabId = (message.payload as { tabId?: number })?.tabId;
        if (typeof tabId !== "number") {
          sendResponse({ ok: false, error: "Неверный tabId" });
          return false;
        }

        (async () => {
          try {
            const manifest = chrome.runtime.getManifest();
            const hhEmployerEntry = manifest.content_scripts?.find((cs) =>
              cs.js?.some((p) => p.includes("hh-employer-content-script")),
            );
            const scriptPath = hhEmployerEntry?.js?.[0];
            if (scriptPath) {
              await chrome.scripting.executeScript({
                target: { tabId },
                files: [scriptPath],
              });
            }
            const resp = await chrome.tabs.sendMessage(tabId, {
              type: "IMPORT_SELECTED_VACANCIES",
            });
            sendResponse(resp ?? { ok: false, error: "Нет ответа" });
          } catch (err) {
            logError("EXECUTE_IMPORT_SELECTED_VACANCIES", err);
            sendResponse({
              ok: false,
              error: err instanceof Error ? err.message : "Ошибка выполнения",
            });
          }
        })();
        return true;
      }

      case "EXECUTE_IMPORT_RESPONSES": {
        const tabId = (message.payload as { tabId?: number })?.tabId;
        if (typeof tabId !== "number") {
          sendResponse({ ok: false, error: "Неверный tabId" });
          return false;
        }
        (async () => {
          try {
            const manifest = chrome.runtime.getManifest();
            const hhEmployerEntry = manifest.content_scripts?.find((cs) =>
              cs.js?.some((p) => p.includes("hh-employer-content-script")),
            );
            const scriptPath = hhEmployerEntry?.js?.[0];
            if (scriptPath) {
              await chrome.scripting.executeScript({
                target: { tabId },
                files: [scriptPath],
              });
            }
            const resp = await chrome.tabs.sendMessage(tabId, {
              type: "IMPORT_RESPONSES",
            });
            sendResponse(resp ?? { ok: false, error: "Нет ответа" });
          } catch (err) {
            logError("EXECUTE_IMPORT_RESPONSES", err);
            sendResponse({
              ok: false,
              error: err instanceof Error ? err.message : "Ошибка выполнения",
            });
          }
        })();
        return true;
      }

      case "EXECUTE_IMPORT_TO_SYSTEM": {
        const payload = message.payload as {
          tabId?: number;
          vacancyId?: unknown;
          workspaceId?: unknown;
        };
        const tabId = payload?.tabId;
        if (typeof tabId !== "number") {
          sendResponse({ ok: false, error: "Неверный tabId" });
          return false;
        }
        const vacancyId =
          payload.vacancyId != null ? String(payload.vacancyId) : undefined;
        const workspaceId =
          payload.workspaceId != null ? String(payload.workspaceId) : undefined;
        (async () => {
          try {
            const manifest = chrome.runtime.getManifest();
            const profileEntry = manifest.content_scripts?.find((cs) =>
              cs.js?.some(
                (p) =>
                  p.includes("content-script") && !p.includes("hh-employer"),
              ),
            );
            const scriptPath = profileEntry?.js?.[0];
            const cssPath = profileEntry?.css?.[0];
            if (scriptPath) {
              if (cssPath) {
                await chrome.scripting.insertCSS({
                  target: { tabId },
                  files: [cssPath],
                });
              }
              await chrome.scripting.executeScript({
                target: { tabId },
                files: [scriptPath],
              });
            }
            const resp = await chrome.tabs.sendMessage(tabId, {
              type: "IMPORT_TO_SYSTEM",
              payload: {
                vacancyId,
                workspaceId,
              },
            });
            sendResponse(resp ?? { ok: false, error: "Нет ответа" });
          } catch (err) {
            logError("EXECUTE_IMPORT_TO_SYSTEM", err);
            sendResponse({
              ok: false,
              error: err instanceof Error ? err.message : "Ошибка выполнения",
            });
          }
        })();
        return true;
      }

      case "EXECUTE_CHECK_AND_SAVE_TO_GLOBAL": {
        const payload = message.payload as {
          tabId?: number;
          workspaceId?: string;
        };
        const tabId = payload?.tabId;
        const workspaceId = payload?.workspaceId;
        if (typeof tabId !== "number" || typeof workspaceId !== "string") {
          sendResponse({ ok: false, error: "Неверный tabId или workspaceId" });
          return false;
        }
        (async () => {
          try {
            const manifest = chrome.runtime.getManifest();
            const profileEntry = manifest.content_scripts?.find((cs) =>
              cs.js?.some(
                (p) =>
                  p.includes("content-script") && !p.includes("hh-employer"),
              ),
            );
            const scriptPath = profileEntry?.js?.[0];
            const cssPath = profileEntry?.css?.[0];
            if (scriptPath) {
              if (cssPath) {
                await chrome.scripting.insertCSS({
                  target: { tabId },
                  files: [cssPath],
                });
              }
              await chrome.scripting.executeScript({
                target: { tabId },
                files: [scriptPath],
              });
            }
            const resp = await chrome.tabs.sendMessage(tabId, {
              type: "CHECK_AND_SAVE_TO_GLOBAL",
              payload: { workspaceId },
            });
            sendResponse(resp ?? { ok: false, error: "Нет ответа" });
          } catch (err) {
            logError("EXECUTE_CHECK_AND_SAVE_TO_GLOBAL", err);
            sendResponse({
              ok: false,
              error: err instanceof Error ? err.message : "Ошибка выполнения",
            });
          }
        })();
        return true;
      }

      case "FETCH_RESUME_PDF": {
        const url = (message.payload as { url?: string })?.url;
        if (typeof url !== "string") {
          sendResponse({ success: false, error: "Неверный URL" });
          return false;
        }

        (async () => {
          try {
            log("Загрузка PDF резюме", { url });
            const response = await fetch(url, {
              credentials: "include",
              headers: {
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
              },
            });

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
              );
            }

            const buffer = await response.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = "";
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i] ?? 0);
            }
            const base64 = btoa(binary);
            const contentType =
              response.headers.get("content-type")?.split(";")[0]?.trim() ||
              "application/pdf";

            sendResponse({
              success: true,
              base64,
              contentType,
            });
          } catch (err) {
            logError("FETCH_RESUME_PDF", err);
            sendResponse({
              success: false,
              error: err instanceof Error ? err.message : "Ошибка загрузки PDF",
            });
          }
        })();
        return true;
      }

      case "FETCH_RESUME_TEXT": {
        const payload = message.payload as { url?: string; referer?: string };
        const url = payload?.url;
        if (typeof url !== "string") {
          sendResponse({ success: false, error: "Неверный URL" });
          return false;
        }
        const referer =
          typeof payload?.referer === "string" ? payload.referer : url;

        (async () => {
          try {
            log("Загрузка текстовой версии резюме", { url });
            const response = await fetch(url, {
              credentials: "include",
              headers: {
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                Referer: referer,
              },
            });

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
              );
            }

            const html = await response.text();

            // HH возвращает conversion_error при ошибке конвертации
            if (html.includes("conversion_error")) {
              throw new Error("HH.ru: ошибка конвертации резюме");
            }

            // Извлекаем innerHTML div.resume (как в download-resume-html)
            // Service Worker не имеет DOMParser — используем подсчёт вложенных div
            const content = extractDivResume(html);
            if (!content) {
              // Fallback: весь body если div.resume не найден
              const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
              const fallback = bodyMatch?.[1]?.trim();
              if (fallback && !fallback.includes("conversion_error")) {
                sendResponse({ success: true, data: fallback });
              } else {
                throw new Error("Не найден div.resume и body в HTML");
              }
            } else {
              sendResponse({ success: true, data: content });
            }
          } catch (err) {
            logError("FETCH_RESUME_TEXT", err);
            sendResponse({
              success: false,
              error: err instanceof Error ? err.message : "Ошибка загрузки",
            });
          }
        })();
        return true;
      }

      case "FETCH_IMAGE": {
        const url = (message.payload as { url?: string })?.url;
        if (typeof url !== "string") {
          sendResponse({ success: false, error: "Неверный URL" });
          return false;
        }

        let parsedUrl: URL;
        try {
          parsedUrl = new URL(url);
        } catch {
          sendResponse({
            success: false,
            error: "Неверный или запрещённый URL",
          });
          return false;
        }
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          log("FETCH_IMAGE blocked: invalid protocol", { url });
          sendResponse({
            success: false,
            error: "Неверный или запрещённый URL",
          });
          return false;
        }
        const imageAllowedHosts = [
          "media.licdn.com",
          "hh.ru",
          "www.hh.ru",
          ...(typeof process !== "undefined" && process.env?.NODE_ENV === "test"
            ? ["cdn.example.com"]
            : []),
        ];
        const isImageHostAllowed = (host: string) =>
          imageAllowedHosts.some((h) => host === h || host.endsWith(`.${h}`));
        const imageHost = parsedUrl.hostname.toLowerCase();
        if (!isImageHostAllowed(imageHost)) {
          log("FETCH_IMAGE blocked: host not in allowlist", {
            url,
            host: imageHost,
          });
          sendResponse({
            success: false,
            error: "Неверный или запрещённый URL",
          });
          return false;
        }

        (async () => {
          try {
            log("Загрузка изображения", { url });
            const response = await fetch(url, {
              credentials: "include",
              headers: { Accept: "image/*" },
              redirect: "error",
            });

            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
              );
            }

            const buffer = await response.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = "";
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i] ?? 0);
            }
            const base64 = btoa(binary);
            const contentType =
              response.headers.get("content-type")?.split(";")[0]?.trim() ||
              "image/jpeg";

            sendResponse({ success: true, base64, contentType });
          } catch (err) {
            logError("FETCH_IMAGE", err);
            sendResponse({
              success: false,
              error:
                err instanceof Error ? err.message : "Ошибка загрузки фото",
            });
          }
        })();
        return true;
      }

      case "FETCH_CHATIK_CHATS": {
        const vacancyExternalId = (
          message.payload as { vacancyExternalId?: string }
        )?.vacancyExternalId;
        if (typeof vacancyExternalId !== "string" || !vacancyExternalId) {
          sendResponse({
            success: false,
            error: "Не указан vacancyExternalId",
          });
          return false;
        }

        (async () => {
          try {
            const allChats: Array<{
              id: string;
              resources?: { RESUME?: string[] };
              lastMessage?: {
                text: string;
                resources?: { RESPONSE_LETTER?: string[] };
              };
            }> = [];
            let page = 0;
            let hasNextPage = true;

            while (hasNextPage) {
              const url = new URL("https://chatik.hh.ru/chatik/api/chats");
              url.searchParams.set("vacancyIds", vacancyExternalId);
              url.searchParams.set("filterUnread", "false");
              url.searchParams.set("do_not_track_session_events", "true");
              url.searchParams.set("page", String(page));

              const response = await fetch(url.toString(), {
                credentials: "include",
                headers: {
                  Accept: "application/json, text/plain, */*",
                  "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                  Origin: "https://hh.ru",
                  Referer: "https://hh.ru/",
                },
              });

              if (!response.ok) {
                throw new Error(
                  `Chatik API: HTTP ${response.status} ${response.statusText}`,
                );
              }

              const data = (await response.json()) as {
                chats?: {
                  items?: unknown[];
                  hasNextPage?: boolean;
                };
              };

              const items = data?.chats?.items ?? [];
              allChats.push(...(items as (typeof allChats)[0][]));
              hasNextPage = data?.chats?.hasNextPage === true;
              page++;
            }

            sendResponse({ success: true, data: allChats });
          } catch (err) {
            logError("FETCH_CHATIK_CHATS", err);
            sendResponse({
              success: false,
              error: err instanceof Error ? err.message : "Ошибка Chatik API",
            });
          }
        })();
        return true;
      }

      case "FETCH_CHATIK_SEARCH": {
        const payload = message.payload as {
          query?: string;
          vacancyExternalId?: string;
        };
        const query = payload?.query;
        const vacancyExternalId = payload?.vacancyExternalId;

        if (typeof query !== "string" || !query.trim()) {
          sendResponse({ success: false, error: "Не указан query для поиска" });
          return false;
        }

        (async () => {
          try {
            const url = new URL("https://chatik.hh.ru/chatik/api/search");
            url.searchParams.set("query", query.trim());
            url.searchParams.set("do_not_track_session_events", "true");
            if (
              typeof vacancyExternalId === "string" &&
              vacancyExternalId.trim()
            ) {
              url.searchParams.set("vacancyIds", vacancyExternalId.trim());
            }

            const response = await fetch(url.toString(), {
              credentials: "include",
              headers: {
                Accept: "application/json, text/plain, */*",
                "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                Origin: "https://hh.ru",
                Referer: "https://hh.ru/",
              },
            });

            if (!response.ok) {
              throw new Error(
                `Chatik Search API: HTTP ${response.status} ${response.statusText}`,
              );
            }

            const data = (await response.json()) as
              | { chats?: { items?: unknown[] } }
              | { items?: unknown[] };
            const items =
              (data && "chats" in data && data.chats?.items) ??
              (data && "items" in data && data.items) ??
              [];

            sendResponse({
              success: true,
              data: Array.isArray(items) ? items : [],
            });
          } catch (err) {
            logError("FETCH_CHATIK_SEARCH", err);
            sendResponse({
              success: false,
              error:
                err instanceof Error ? err.message : "Ошибка Chatik Search API",
            });
          }
        })();
        return true;
      }

      default:
        logError("Неизвестный тип сообщения", message.type);
        sendResponse({
          success: false,
          error: "Неизвестный тип сообщения",
        });
        return false;
    }
  },
);

/**
 * Обработка установки расширения
 */
chrome.runtime.onInstalled.addListener((details) => {
  log("Расширение установлено", { reason: details.reason });

  if (details.reason === "install") {
    log("Первая установка расширения");
  } else if (details.reason === "update") {
    log("Расширение обновлено", {
      previousVersion: details.previousVersion,
    });
  }
});

/**
 * Обработка запуска service worker
 */
log("Service Worker запущен");
