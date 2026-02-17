/**
 * Конфигурация расширения.
 * API URL — адрес сервиса (тот же, что NEXT_PUBLIC_APP_URL в приложении).
 * Переопределяется при сборке через EXTENSION_API_URL.
 */
declare const __API_URL__: string | undefined;
export const API_URL =
  typeof __API_URL__ !== "undefined" ? __API_URL__ : "https://app.avtonaim.qbsoft.ru";
