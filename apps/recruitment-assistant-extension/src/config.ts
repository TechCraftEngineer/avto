/**
 * Конфигурация расширения.
 * API_URL — адрес основного приложения (auth, health).
 * EXTENSION_API_BASE — опционально, отдельный API для импорта (Hono).
 *   Если задан — используется для hh-import и workspaces.
 *   Если нет — используется API_URL + /api/extension.
 */
declare const __API_URL__: string | undefined;
declare const __EXTENSION_API_BASE__: string | undefined;

export const API_URL =
  typeof __API_URL__ !== "undefined" ? __API_URL__ : "https://app.avtonaim.qbsoft.ru";

/** Базовый URL для extension API (hh-import, workspaces). При наличии — используется вместо API_URL + /api/extension */
export const EXTENSION_API_BASE: string | undefined =
  typeof __EXTENSION_API_BASE__ !== "undefined" && __EXTENSION_API_BASE__
    ? __EXTENSION_API_BASE__
    : undefined;

export function getExtensionApiUrl(path: string): string {
  const base = EXTENSION_API_BASE ?? API_URL + "/api/extension";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
