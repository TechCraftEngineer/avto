/**
 * Content Script для Recruitment Assistant Extension
 *
 * Запускается на страницах LinkedIn и HeadHunter.
 * Координирует: определение платформы, извлечение данных, панель, экспорт, импорт.
 */

import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import type { PlatformAdapter } from "../adapters/base/platform-adapter";
import type { CandidateData } from "../shared/types";
import {
  exportCandidateData,
  extractCandidateData,
  importCandidateData,
  resolvePlatform,
  setNestedValue,
  showError,
  showNotification,
} from "./lib";
import { DataPanel } from "./ui/data-panel";

export class ContentScript {
  private isInitialized = false;
  private currentData: CandidateData | null = null;
  private currentAdapter: PlatformAdapter | null = null;
  private panelContainer: HTMLDivElement | null = null;
  private panelRoot: Root | null = null;

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
    // UI только через popup, на странице — только панель данных после извлечения
  }

  triggerExtract(): Promise<void> {
    return this.handleExtract();
  }

  triggerExport(): Promise<void> {
    return this.handleExport();
  }

  triggerImport(payload?: { vacancyId?: string }): Promise<void> {
    return this.handleImport(payload);
  }

  private async handleExtract(): Promise<void> {
    try {
      const data = await extractCandidateData(this.currentAdapter);
      if (data) {
        await this.showDataPanel(data);
      } else {
        showError(
          "Не удалось извлечь данные профиля. Попробуйте обновить страницу.",
        );
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      showError(msg);
    }
  }

  private async showDataPanel(data: CandidateData): Promise<void> {
    this.currentData = data;

    if (this.panelContainer && this.panelRoot) {
      this.renderDataPanel(data);
      return;
    }

    this.panelContainer = document.createElement("div");
    this.panelContainer.id = "recruitment-assistant-data-panel";
    document.body.appendChild(this.panelContainer);

    this.panelRoot = createRoot(this.panelContainer);
    this.renderDataPanel(data);
  }

  private renderDataPanel(data: CandidateData): void {
    if (!this.panelRoot) return;
    this.panelRoot.render(
      <DataPanel
        data={data}
        onEdit={(field, value) => this.handleEdit(field, value)}
      />,
    );
  }

  private handleEdit(field: string, value: unknown): void {
    if (!this.currentData) return;

    try {
      const updatedData = { ...this.currentData };
      setNestedValue(updatedData, field.split("."), value);
      this.currentData = updatedData;
      this.renderDataPanel(updatedData);
    } catch {
      showError(
        "Не удалось обновить поле. Попробуйте еще раз или обновите страницу.",
      );
    }
  }

  private async handleExport(): Promise<void> {
    if (!this.currentData) {
      showNotification({ type: "error", message: "Нет данных для экспорта" });
      return;
    }
    try {
      await exportCandidateData(this.currentData);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Не удалось экспортировать";
      showNotification({ type: "error", message: msg });
      throw error;
    }
  }

  private async handleImport(payload?: { vacancyId?: string }): Promise<void> {
    if (!this.currentData) {
      showNotification({ type: "error", message: "Нет данных для импорта" });
      return;
    }
    try {
      await importCandidateData(this.currentData, {
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
    if (this.panelRoot) {
      this.panelRoot.unmount();
      this.panelRoot = null;
    }
    if (this.panelContainer?.parentNode) {
      this.panelContainer.parentNode.removeChild(this.panelContainer);
    }
    this.panelContainer = null;
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

  const MESSAGE_TYPES = [
    "EXTRACT_DATA",
    "EXPORT_CLIPBOARD",
    "IMPORT_TO_SYSTEM",
  ] as const;

  chrome.runtime.onMessage.addListener(
    (msg: { type?: string }, _s, sendResponse) => {
      const t = msg?.type;
      if (!t || !(MESSAGE_TYPES as readonly string[]).includes(t)) return false;

      const run = async () => {
        try {
          if (t === "EXTRACT_DATA") await contentScript.triggerExtract();
          else if (t === "EXPORT_CLIPBOARD")
            await contentScript.triggerExport();
          else if (t === "IMPORT_TO_SYSTEM")
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
