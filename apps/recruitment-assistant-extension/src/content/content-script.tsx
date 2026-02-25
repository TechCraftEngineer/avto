/**
 * Content Script для Recruitment Assistant Extension
 *
 * Запускается на страницах LinkedIn и HeadHunter.
 * Координирует: определение платформы, извлечение и импорт данных.
 */

import type { PlatformAdapter } from "../adapters/base/platform-adapter";
import type { CandidateData } from "../shared/types";
import {
  extractCandidateData,
  importCandidateData,
  resolvePlatform,
  showNotification,
} from "./lib";

export class ContentScript {
  private isInitialized = false;
  private currentData: CandidateData | null = null;
  private currentAdapter: PlatformAdapter | null = null;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const adapter = resolvePlatform();
      if (adapter) {
        this.currentAdapter = adapter;
        await this.setupUI();
      }
    } catch (error) {
      console.error("[Recruitment Assistant] Ошибка инициализации:", error);
    }
    this.isInitialized = true;
  }

  private async setupUI(): Promise<void> {
    // UI только через popup
  }

  triggerImport(payload?: { vacancyId?: string }): Promise<void> {
    return this.handleImport(payload);
  }

  private async handleImport(payload?: { vacancyId?: string }): Promise<void> {
    let data = this.currentData;
    if (!data) {
      if (!this.currentAdapter) {
        showNotification({
          type: "error",
          message: "Страница не поддерживается для импорта",
        });
        return;
      }
      try {
        data = await extractCandidateData(this.currentAdapter);
        if (data) {
          this.currentData = data;
        }
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Не удалось извлечь данные профиля";
        showNotification({ type: "error", message: msg });
        return;
      }
    }
    if (!data) {
      showNotification({
        type: "error",
        message:
          "Не удалось извлечь данные профиля. Попробуйте обновить страницу.",
      });
      return;
    }
    try {
      await importCandidateData(data, {
        vacancyId: payload?.vacancyId,
      });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Не удалось импортировать";
      showNotification({ type: "error", message: msg });
      throw new Error(msg);
    }
  }

  cleanup(): void {
    this.currentData = null;
    this.currentAdapter = null;
    this.isInitialized = false;
  }
}

// Bootstrap
if (typeof process === "undefined" || process.env.NODE_ENV !== "test") {
  const contentScript = new ContentScript();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => contentScript.init());
  } else {
    contentScript.init();
  }

  window.addEventListener("beforeunload", () => contentScript.cleanup());

  const MESSAGE_TYPES = ["IMPORT_TO_SYSTEM"] as const;

  chrome.runtime.onMessage.addListener(
    (msg: { type?: string }, _s, sendResponse) => {
      const t = msg?.type;
      if (!t || !(MESSAGE_TYPES as readonly string[]).includes(t)) return false;

      const run = async () => {
        try {
          if (t === "IMPORT_TO_SYSTEM")
            await contentScript.triggerImport(
              (msg as { payload?: { vacancyId?: string } })?.payload,
            );
          return { ok: true as const };
        } catch (e) {
          return { ok: false as const, error: String(e) };
        }
      };
      run().then(sendResponse);
      return true;
    },
  );
}
