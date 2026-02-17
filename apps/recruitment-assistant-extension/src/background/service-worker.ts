/**
 * Background Service Worker для Recruitment Assistant Extension
 *
 * Обрабатывает сообщения от content script и проксирует API запросы
 * для обхода CORS ограничений.
 */

/**
 * Типы сообщений от content script
 */
type MessageType = "API_REQUEST" | "PING";

/**
 * Структура сообщения от content script
 */
interface Message {
  type: MessageType;
  payload?: ApiRequest | Record<string, unknown>;
}

/**
 * Структура API запроса
 */
interface ApiRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string;
}

/**
 * Структура ответа на API запрос
 */
interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  status?: number;
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

    // Проверка, что используется HTTPS
    if (!request.url.startsWith("https://")) {
      throw new Error("Разрешены только HTTPS запросы");
    }

    // Подготовка заголовков
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...request.headers,
    };

    // Подготовка опций запроса
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Добавление тела запроса для POST/PUT/PATCH
    if (request.body && ["POST", "PUT", "PATCH"].includes(request.method)) {
      fetchOptions.body = JSON.stringify(request.body);
    }

    // Выполнение запроса
    const response = await fetch(request.url, fetchOptions);

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

      // Безопасное извлечение сообщения об ошибке
      const errorMessage =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
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

    if (error instanceof TypeError && error.message.includes("fetch")) {
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
 * Обработка сообщений от content script
 */
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (
      response:
        | ApiResponse
        | { success: boolean; message?: string; error?: string },
    ) => void,
  ) => {
    log("Получено сообщение", { type: message.type, sender: sender.tab?.url });

    // Обработка разных типов сообщений
    switch (message.type) {
      case "API_REQUEST": {
        // Проксирование API запроса
        const apiRequest = message.payload as ApiRequest;

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
