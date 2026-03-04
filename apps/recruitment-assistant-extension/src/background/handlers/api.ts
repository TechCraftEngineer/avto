/**
 * Обработчики API_REQUEST и PING
 */

import { isApiRequest, proxyApiRequest } from "../api-proxy";
import { log, logError } from "../lib";
import type { ServiceWorkerResponse } from "../types";

export function handleApiRequest(
  payload: unknown,
  sendResponse: (r: ServiceWorkerResponse) => void,
): boolean {
  if (!isApiRequest(payload)) {
    sendResponse({
      success: false,
      error: "Некорректный формат запроса: ожидается объект с url и method",
    });
    return false;
  }

  proxyApiRequest(payload)
    .then((response) => sendResponse(response))
    .catch((error) => {
      logError("Необработанная ошибка при проксировании", error);
      sendResponse({
        success: false,
        error: "Внутренняя ошибка при обработке запроса",
      });
    });

  return true;
}

export function handlePing(
  sendResponse: (r: ServiceWorkerResponse) => void,
): boolean {
  log("Получен PING");
  sendResponse({ success: true, message: "pong" });
  return false;
}
