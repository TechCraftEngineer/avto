/**
 * Обработчик FETCH_LINKEDIN_DETAILS
 */

import { logError } from "../lib";
import type { ServiceWorkerResponse } from "../types";

function extractFromTab(url: string, selectors: string[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: false }, (tab) => {
      if (chrome.runtime.lastError || !tab?.id) {
        reject(new Error("Не удалось создать вкладку"));
        return;
      }
      const tabId = tab.id;
      const timeout = setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.tabs.remove(tabId).catch(() => {});
        resolve([]);
      }, 15000);
      const onUpdated = (id: number, info: { status?: string }) => {
        if (id !== tabId || info.status !== "complete") return;
        chrome.tabs.onUpdated.removeListener(onUpdated);
        setTimeout(() => {
          chrome.scripting
            .executeScript({
              target: { tabId },
              func: (sels: string[]) => {
                const results: string[] = [];
                for (const sel of sels) {
                  const el = document.querySelector(sel);
                  if (el) {
                    const match = sel.match(/\[data-testid="lazy-column"\]/);
                    if (match) {
                      const cols = document.querySelectorAll(sel);
                      const parts: string[] = [];
                      cols.forEach((c) => {
                        parts.push(c.outerHTML);
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
              args: [selectors],
            })
            .then(([result]) => {
              clearTimeout(timeout);
              chrome.tabs.remove(tabId).catch(() => {});
              resolve((result?.result as string[]) ?? []);
            })
            .catch((err) => {
              clearTimeout(timeout);
              chrome.tabs.remove(tabId).catch(() => {});
              reject(err);
            });
        }, 2500);
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

  try {
    const baseUrl = "https://www.linkedin.com";
    const urls = {
      experience: `${baseUrl}/in/${username}/details/experience/`,
      education: `${baseUrl}/in/${username}/details/education/`,
      skills: `${baseUrl}/in/${username}/details/skills/`,
    };

    const expHtml =
      (
        await extractFromTab(urls.experience, [
          'div[data-testid^="profile_ExperienceDetailsSection_"]',
        ])
      )[0] ?? "";
    const eduHtml =
      (
        await extractFromTab(urls.education, [
          'div[data-testid^="profile_EducationDetailsSection_"]',
        ])
      )[0] ?? "";
    const skillsHtml =
      (
        await extractFromTab(urls.skills, ['div[data-testid="lazy-column"]'])
      )[0] ?? "";

    sendResponse({
      success: true,
      data: {
        experienceHtml: expHtml || undefined,
        educationHtml: eduHtml || undefined,
        skillsHtml: skillsHtml || undefined,
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
