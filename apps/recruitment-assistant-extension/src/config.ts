/**
 * Конфигурация расширения.
 * API_URL — адрес основного приложения (auth, health).
 * EXTENSION_API_BASE — базовый URL Hono API для импорта (hh-import, workspaces).
 */
declare const __API_URL__: string | undefined;
declare const __EXTENSION_API_BASE__: string;

export const API_URL =
  typeof __API_URL__ !== "undefined" ? __API_URL__ : "https://app.avtonaim.qbsoft.ru";

/** Базовый URL extension-api (Hono) — hh-import, workspaces */
export const EXTENSION_API_BASE: string =
  typeof __EXTENSION_API_BASE__ !== "undefined" ? __EXTENSION_API_BASE__ : "http://localhost:3002";

export function getExtensionApiUrl(path: string): string {
  return `${EXTENSION_API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
