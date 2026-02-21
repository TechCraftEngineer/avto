import { useEffect, useState } from "react";
import type { PageContext } from "../types";
import { getPageContext } from "../utils";

const HH_SELECTED_STORAGE_KEY = "hh-selected-vacancy-ids";

export function usePageContext() {
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [selectedCount, setSelectedCount] = useState<number | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      const url = tab?.url;
      if (url) setPageContext(getPageContext(url));
    });
  }, []);

  useEffect(() => {
    if (pageContext?.type !== "hh-vacancies") return;

    const updateCount = () => {
      chrome.storage.local.get(HH_SELECTED_STORAGE_KEY).then((r) => {
        const arr = r[HH_SELECTED_STORAGE_KEY] as string[] | undefined;
        setSelectedCount(Array.isArray(arr) ? arr.length : 0);
      });
    };

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

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [pageContext]);

  return { pageContext, selectedCount, setSelectedCount };
}
