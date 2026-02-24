import { useEffect, useState } from "react";
import type { PageContext } from "../types";
import { getPageContext } from "../utils";

function fetchPageContextFromActiveTab(
  cb: (ctx: PageContext | null) => void,
): void {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const url = tab?.url;
    cb(url ? (getPageContext(url) ?? null) : null);
  });
}

/** Запрашивает count у content script — источник правды (DOM страницы) */
function fetchSelectedCount(cb: (n: number) => void): void {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) {
      cb(0);
      return;
    }
    chrome.tabs
      .sendMessage(tab.id, { type: "GET_SELECTED_VACANCIES_COUNT" })
      .then((resp: { count?: number }) => cb(resp?.count ?? 0))
      .catch(() => cb(0));
  });
}

export function usePageContext() {
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [selectedCount, setSelectedCount] = useState<number | null>(null);

  useEffect(() => {
    fetchPageContextFromActiveTab(setPageContext);

    const onActivated = () => {
      fetchPageContextFromActiveTab(setPageContext);
    };

    const onUpdated = (
      tabId: number,
      changeInfo: { status?: string; url?: string },
      tab: chrome.tabs.Tab,
    ) => {
      if (changeInfo.status !== "complete") return;
      chrome.tabs.query(
        { active: true, lastFocusedWindow: true },
        ([active]) => {
          if (active?.id === tabId) {
            const url = changeInfo.url ?? tab?.url;
            if (url) setPageContext(getPageContext(url) ?? null);
          }
        },
      );
    };

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  useEffect(() => {
    if (pageContext?.type !== "hh-vacancies") return;

    const updateCount = () => fetchSelectedCount(setSelectedCount);
    updateCount();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") updateCount();
    };
    const pollInterval = setInterval(updateCount, 1500);

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pageContext]);

  return { pageContext, selectedCount, setSelectedCount };
}
