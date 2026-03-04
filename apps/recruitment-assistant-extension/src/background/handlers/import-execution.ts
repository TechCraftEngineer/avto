/**
 * Обработчики EXECUTE_IMPORT_* — выполнение скриптов во вкладках
 */

import { logError } from "../lib";
import type { ServiceWorkerResponse } from "../types";

type ScriptKind = "hh-employer" | "profile";

function getScriptPaths(kind: ScriptKind): {
  scriptPath?: string;
  cssPath?: string;
} {
  const manifest = chrome.runtime.getManifest();
  const entry = manifest.content_scripts?.find((cs) =>
    kind === "hh-employer"
      ? cs.js?.some((p) => p.includes("hh-employer-content-script"))
      : cs.js?.some(
          (p) => p.includes("content-script") && !p.includes("hh-employer"),
        ),
  );
  return {
    scriptPath: entry?.js?.[0],
    cssPath: entry?.css?.[0],
  };
}

async function injectAndSend(
  tabId: number,
  kind: ScriptKind,
  message: { type: string; payload?: Record<string, unknown> },
): Promise<ServiceWorkerResponse> {
  const { scriptPath, cssPath } = getScriptPaths(kind);
  if (!scriptPath) {
    throw new Error(`Script path not found for kind: ${kind}`);
  }
  if (cssPath && kind === "profile") {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: [cssPath],
    });
  }
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [scriptPath],
  });
  const resp = await chrome.tabs.sendMessage(tabId, message);
  return resp ?? { ok: false, error: "Нет ответа" };
}

export async function handleExecuteImportSelectedVacancies(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const tabId = payload?.tabId;
  if (typeof tabId !== "number") {
    sendResponse({ ok: false, error: "Неверный tabId" });
    return;
  }
  try {
    const resp = await injectAndSend(tabId, "hh-employer", {
      type: "IMPORT_SELECTED_VACANCIES",
    });
    sendResponse(resp);
  } catch (err) {
    logError("EXECUTE_IMPORT_SELECTED_VACANCIES", err);
    sendResponse({
      ok: false,
      error: err instanceof Error ? err.message : "Ошибка выполнения",
    });
  }
}

export async function handleExecuteImportResponses(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const tabId = payload?.tabId;
  if (typeof tabId !== "number") {
    sendResponse({ ok: false, error: "Неверный tabId" });
    return;
  }
  try {
    const resp = await injectAndSend(tabId, "hh-employer", {
      type: "IMPORT_RESPONSES",
    });
    sendResponse(resp);
  } catch (err) {
    logError("EXECUTE_IMPORT_RESPONSES", err);
    sendResponse({
      ok: false,
      error: err instanceof Error ? err.message : "Ошибка выполнения",
    });
  }
}

export async function handleExecuteImportToSystem(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const tabId = payload?.tabId;
  if (typeof tabId !== "number") {
    sendResponse({ ok: false, error: "Неверный tabId" });
    return;
  }
  const vacancyId =
    payload.vacancyId != null ? String(payload.vacancyId) : undefined;
  const workspaceId =
    payload.workspaceId != null ? String(payload.workspaceId) : undefined;

  try {
    const resp = await injectAndSend(tabId, "profile", {
      type: "IMPORT_TO_SYSTEM",
      payload: { vacancyId, workspaceId },
    });
    sendResponse(resp);
  } catch (err) {
    logError("EXECUTE_IMPORT_TO_SYSTEM", err);
    sendResponse({
      ok: false,
      error: err instanceof Error ? err.message : "Ошибка выполнения",
    });
  }
}

export async function handleExecuteCheckAndSaveToGlobal(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const tabId = payload?.tabId;
  const workspaceId = payload?.workspaceId;
  if (typeof tabId !== "number" || typeof workspaceId !== "string") {
    sendResponse({ ok: false, error: "Неверный tabId или workspaceId" });
    return;
  }
  try {
    const resp = await injectAndSend(tabId, "profile", {
      type: "CHECK_AND_SAVE_TO_GLOBAL",
      payload: { workspaceId },
    });
    sendResponse(resp);
  } catch (err) {
    logError("EXECUTE_CHECK_AND_SAVE_TO_GLOBAL", err);
    sendResponse({
      ok: false,
      error: err instanceof Error ? err.message : "Ошибка выполнения",
    });
  }
}
