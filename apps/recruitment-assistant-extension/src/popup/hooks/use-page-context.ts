import { useEffect, useState } from "react";
import type { PageContext } from "../types";
import { getPageContext } from "../utils";

const HH_SELECTED_STORAGE_KEY = "hh-selected-vacancy-ids";

function fetchPageContextFromActiveTab(
  cb: (ctx: PageContext | null) => void,
): void {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const url = tab?.url;
    cb(url ? (getPageContext(url) ?? null) : null);
  });
}

function fetchSelectedCount(cb: (n: number) => void): void {
  chrome.storage.local.get(HH_SELECTED_STORAGE_KEY).then((r) => {
    const arr = r[HH_SELECTED_STORAGE_KEY] as string[] | undefined;
    cb(Array.isArray(arr) ? arr.length : 0);
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

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName === "local" && changes[HH_SELECTED_STORAGE_KEY]) {
        const arr = changes[HH_SELECTED_STORAGE_KEY].newValue as
          | string[]
          | undefined;
        setSelectedCount(Array.isArray(arr) ? arr.length : 0);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") updateCount();
    };

    // Опрос: popup при закрытии уничтожается, и при повторном открытии
    // нужен актуальный count. storage.onChanged срабатывает только пока popup открыт.
    const pollInterval = setInterval(updateCount, 1500);

    chrome.storage.onChanged.addListener(listener);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      chrome.storage.onChanged.removeListener(listener);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pageContext]);

  return { pageContext, selectedCount, setSelectedCount };
}
