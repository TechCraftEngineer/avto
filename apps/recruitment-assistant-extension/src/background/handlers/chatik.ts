/**
 * Обработчики FETCH_CHATIK_CHATS и FETCH_CHATIK_SEARCH
 */

import { logError } from "../lib";
import type { ServiceWorkerResponse } from "../types";

const CHATIK_HEADERS = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
  Origin: "https://hh.ru",
  Referer: "https://hh.ru/",
} as const;

export async function handleFetchChatikChats(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const vacancyExternalId = payload?.vacancyExternalId;
  if (typeof vacancyExternalId !== "string" || !vacancyExternalId) {
    sendResponse({
      success: false,
      error: "Не указан vacancyExternalId",
    });
    return;
  }

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
        headers: CHATIK_HEADERS,
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
}

export async function handleFetchChatikSearch(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const query = payload?.query;
  const vacancyExternalId = payload?.vacancyExternalId;

  if (typeof query !== "string" || !query.trim()) {
    sendResponse({ success: false, error: "Не указан query для поиска" });
    return;
  }

  try {
    const url = new URL("https://chatik.hh.ru/chatik/api/search");
    url.searchParams.set("query", query.trim());
    url.searchParams.set("do_not_track_session_events", "true");
    if (typeof vacancyExternalId === "string" && vacancyExternalId.trim()) {
      url.searchParams.set("vacancyIds", vacancyExternalId.trim());
    }

    const response = await fetch(url.toString(), {
      credentials: "include",
      headers: CHATIK_HEADERS,
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
      error: err instanceof Error ? err.message : "Ошибка Chatik Search API",
    });
  }
}
