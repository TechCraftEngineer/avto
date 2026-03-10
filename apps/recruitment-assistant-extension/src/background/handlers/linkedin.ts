/**
 * Обработчик FETCH_LINKEDIN_DETAILS
 */

import { logError } from "../lib";
import type { ServiceWorkerResponse } from "../types";

interface ExtractOptions {
  /** Задержка перед извлечением (ms). Для React-страниц — дольше. */
  delayMs?: number;
  /** Минимальная длина текста элемента для учёта готовности. Для контактов — меньше. */
  minContentLength?: number;
}

function extractFromTab(
  url: string,
  selectors: string[],
  options: ExtractOptions = {},
): Promise<string[]> {
  const { delayMs = 1800, minContentLength = 50 } = options;

  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: false }, (tab) => {
      if (chrome.runtime.lastError || !tab?.id) {
        reject(new Error("Не удалось создать вкладку"));
        return;
      }
      const tabId = tab.id;
      let completed = false;
      const timeoutId = setTimeout(() => {
        if (completed) return;
        completed = true;
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.tabs.remove(tabId).catch(() => {});
        resolve([]);
      }, 20000);

      function cleanup(
        resolveOrReject: (value: string[] | PromiseLike<string[]>) => void,
        value: string[],
      ): void;
      function cleanup(
        rejectFn: (reason?: unknown) => void,
        err: unknown,
      ): void;
      function cleanup(
        fn: ((v: string[]) => void) | ((err?: unknown) => void),
        val: string[] | unknown,
      ): void {
        if (completed) return;
        completed = true;
        clearTimeout(timeoutId);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.tabs.remove(tabId).catch(() => {});
        (fn as (arg?: unknown) => void)(val);
      }

      const onUpdated = (id: number, info: { status?: string }) => {
        if (id !== tabId || info.status !== "complete") return;
        clearTimeout(timeoutId);
        chrome.tabs.onUpdated.removeListener(onUpdated);
        // Уменьшенная задержка: скрипт внутри опрашивает контент до 8 сек.
        const effectiveDelay = Math.min(delayMs, 800);
        setTimeout(() => {
          chrome.scripting
            .executeScript({
              target: { tabId },
              func: async (sels: string[], minLen: number) => {
                const POLL_INTERVAL_MS = 400;
                const MAX_WAIT_MS = 8000;

                function hasContent(el: Element): boolean {
                  const text = (el.textContent ?? "").trim();
                  return text.length >= minLen;
                }

                async function waitForElementWithContent(
                  sel: string,
                ): Promise<Element | null> {
                  const start = Date.now();
                  while (Date.now() - start < MAX_WAIT_MS) {
                    const el = document.querySelector(sel);
                    if (el && hasContent(el)) return el;
                    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
                  }
                  return document.querySelector(sel);
                }

                function isPlaceholder(el: Element): boolean {
                  const text = (el.textContent ?? "")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();
                  if (!text) return true;
                  return /^(load\s*more|show\s*more|see\s*more)\.?\s*$/.test(
                    text,
                  );
                }

                const results: string[] = [];
                for (const sel of sels) {
                  const el = await waitForElementWithContent(sel);
                  if (el && !isPlaceholder(el)) {
                    const match = sel.match(/\[data-testid="lazy-column"\]/);
                    if (match) {
                      const cols = document.querySelectorAll(sel);
                      const parts: string[] = [];
                      cols.forEach((c) => {
                        if (!isPlaceholder(c)) parts.push(c.outerHTML);
                      });
                      results.push(
                        parts.length ? `<div>${parts.join("")}</div>` : "",
                      );
                    } else {
                      results.push(el.outerHTML);
                    }
                  } else {
                    results.push("");
                  }
                }
                return results;
              },
              args: [selectors, minContentLength],
            })
            .then(([result]) => {
              cleanup(resolve, (result?.result as string[]) ?? []);
            })
            .catch((err) => {
              cleanup(reject, err);
            });
        }, effectiveDelay);
      };
      chrome.tabs.onUpdated.addListener(onUpdated);
    });
  });
}

export async function handleFetchLinkedInDetails(
  payload: Record<string, unknown>,
  sendResponse: (r: ServiceWorkerResponse) => void,
): Promise<void> {
  const username = payload?.username;
  if (typeof username !== "string" || !username.trim()) {
    sendResponse({ success: false, error: "Не указан username" });
    return;
  }

  const normalizedUsername = encodeURIComponent(username.trim());

  try {
    const baseUrl = "https://www.linkedin.com";
    const urls = {
      experience: `${baseUrl}/in/${normalizedUsername}/details/experience/`,
      education: `${baseUrl}/in/${normalizedUsername}/details/education/`,
      skills: `${baseUrl}/in/${normalizedUsername}/details/skills/`,
      contactInfo: `${baseUrl}/in/${normalizedUsername}/overlay/contact-info/`,
    };

    // Параллельная загрузка: 4 вкладки одновременно вместо последовательно
    const [expResults, eduResults, skillsResults, contactInfoResults] =
      await Promise.all([
        extractFromTab(urls.experience, [
          'div[data-testid^="profile_ExperienceDetailsSection_"]',
        ]),
        extractFromTab(urls.education, [
          'div[data-testid^="profile_EducationDetailsSection_"]',
        ]),
        extractFromTab(urls.skills, ['div[data-testid="lazy-column"]']),
        extractFromTab(
          urls.contactInfo,
          [
            'div[data-view-name="profile-contact-info-details-view"]',
            '[data-view-name="profile-contact-info-details-view"]', // fallback если не div
          ],
          {
            delayMs: 1500, // overlay рендерит дольше; polling дополняет ожидание
            minContentLength: 15, // блок контактов может быть небольшим
          },
        ),
      ]);

    const expHtml = expResults[0] ?? "";
    const eduHtml = eduResults[0] ?? "";
    const skillsHtml = skillsResults[0] ?? "";
    const contactInfoHtml =
      contactInfoResults.find((html) => html?.trim().length > 0) ?? "";

    sendResponse({
      success: true,
      data: {
        experienceHtml: expHtml || undefined,
        educationHtml: eduHtml || undefined,
        skillsHtml: skillsHtml || undefined,
        contactInfoHtml: contactInfoHtml || undefined,
      },
    });
  } catch (err) {
    logError("FETCH_LINKEDIN_DETAILS", err);
    sendResponse({
      success: false,
      error: err instanceof Error ? err.message : "Ошибка загрузки LinkedIn",
    });
  }
}
