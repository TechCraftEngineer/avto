/**
 * Клиент для взаимодействия с Background Service Worker
 */

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
 * Отправка API запроса через Service Worker для обхода CORS
 */
export async function sendApiRequest(
  request: ApiRequest,
): Promise<ApiResponse> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "API_REQUEST",
      payload: request,
    });

    return response as ApiResponse;
  } catch (error) {
    console.error("Ошибка при отправке сообщения Service Worker:", error);

    return {
      success: false,
      error: "Не удалось связаться с Service Worker",
    };
  }
}

/**
 * Проверка работоспособности Service Worker
 */
export async function pingServiceWorker(): Promise<boolean> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "PING",
    });

    return response?.success === true;
  } catch (error) {
    console.error("Service Worker не отвечает:", error);
    return false;
  }
}
