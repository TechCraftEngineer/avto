/**
 * Отслеживание SPA-навигации (React Router, History API).
 *
 * LinkedIn и другие SPA не перезагружают страницу при переходе между профилями,
 * поэтому DOMContentLoaded и beforeunload не срабатывают. Данный модуль
 * обнаруживает смену URL через History API (pushState, replaceState, popstate).
 */

const LINKEDIN_PROFILE_PATH = /^\/in\/[^/]+\/?/;

function isLinkedInProfileUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return (
      parsed.hostname.includes("linkedin.com") &&
      LINKEDIN_PROFILE_PATH.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

export type OnUrlChangeCallback = (oldUrl: string, newUrl: string) => void;

let lastUrl = typeof window !== "undefined" ? window.location.href : "";
const listeners: OnUrlChangeCallback[] = [];
let subscriptionCount = 0;
let origPushState: typeof history.pushState | null = null;
let origReplaceState: typeof history.replaceState | null = null;

function notifyUrlChange(oldUrl: string, newUrl: string): void {
  lastUrl = newUrl;
  for (const cb of listeners) {
    try {
      cb(oldUrl, newUrl);
    } catch (e) {
      console.error("[SPA Nav] listener error:", e);
    }
  }
}

function checkAndNotify(): void {
  const newUrl = window.location.href;
  if (newUrl !== lastUrl) {
    notifyUrlChange(lastUrl, newUrl);
  }
}

function installHistoryPatch(): void {
  if (origPushState !== null) return;
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  origPushState = push;
  origReplaceState = replace;

  history.pushState = (...args: Parameters<typeof history.pushState>): void => {
    const prev = window.location.href;
    push(...args);
    const next = window.location.href;
    if (prev !== next) notifyUrlChange(prev, next);
  };

  history.replaceState = (
    ...args: Parameters<typeof history.replaceState>
  ): void => {
    const prev = window.location.href;
    replace(...args);
    const next = window.location.href;
    if (prev !== next) notifyUrlChange(prev, next);
  };

  window.addEventListener("popstate", checkAndNotify);
}

function uninstallHistoryPatch(): void {
  if (subscriptionCount > 0) return;
  window.removeEventListener("popstate", checkAndNotify);
  if (origPushState) history.pushState = origPushState;
  if (origReplaceState) history.replaceState = origReplaceState;
  origPushState = null;
  origReplaceState = null;
}

/**
 * Подписывается на изменения URL (SPA-навигация).
 * Вызывает callback только если старый и новый URL — профили LinkedIn.
 */
export function observeSpaNavigation(
  callback: OnUrlChangeCallback,
): () => void {
  if (typeof window === "undefined") return () => {};

  lastUrl = window.location.href;
  listeners.push(callback);
  subscriptionCount++;

  if (subscriptionCount === 1) {
    installHistoryPatch();
  }

  let unsubscribed = false;
  return () => {
    if (unsubscribed) return;
    unsubscribed = true;

    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);

    if (subscriptionCount > 0) {
      subscriptionCount--;
      if (subscriptionCount === 0) uninstallHistoryPatch();
    }
  };
}

/**
 * Проверяет, нужно ли инвалидировать кэш: оба URL — профили LinkedIn и они различаются.
 */
export function shouldInvalidateLinkedInCache(
  oldUrl: string,
  newUrl: string,
): boolean {
  return (
    isLinkedInProfileUrl(oldUrl) &&
    isLinkedInProfileUrl(newUrl) &&
    oldUrl !== newUrl
  );
}
