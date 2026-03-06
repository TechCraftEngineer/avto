/**
 * Content Script для Recruitment Assistant Extension
 *
 * Запускается на страницах LinkedIn и HeadHunter.
 * Координирует: определение платформы, извлечение и импорт данных.
 */

import type { PlatformAdapter } from "../adapters/base/platform-adapter";
import type { CandidateData } from "../shared/types";
import {
  buildResponseText,
  checkDuplicateCandidate,
  extractCandidateData,
  importCandidateData,
  importToGlobalOnly,
  importToVacancyWithExisting,
  resolvePlatform,
  showNotification,
} from "./lib";
import {
  extractAndSanitizeLinkedInHtml,
  type LinkedInHtmlAdapter,
} from "./lib/sanitize-html";
import {
  observeSpaNavigation,
  shouldInvalidateLinkedInCache,
} from "./lib/spa-navigation-observer";

export class ContentScript {
  private isInitialized = false;
  private currentData: CandidateData | null = null;
  private currentAdapter: PlatformAdapter | null = null;
  private unsubscribeSpaNav: (() => void) | null = null;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const adapter = resolvePlatform();
      if (adapter) {
        this.currentAdapter = adapter;
        await this.setupUI();
      }
      // SPA observer — на LinkedIn всегда (лента → профиль → другой профиль)
      if (
        typeof window !== "undefined" &&
        window.location.hostname.includes("linkedin.com")
      ) {
        this.setupSpaNavigationObserver();
      }
    } catch (error) {
      console.error("[Recruitment Assistant] Ошибка инициализации:", error);
    }
    this.isInitialized = true;
  }

  /** Отслеживание SPA-навигации (LinkedIn React) — сброс кэша при смене профиля */
  private setupSpaNavigationObserver(): void {
    if (typeof window === "undefined") return;
    this.unsubscribeSpaNav?.();
    this.unsubscribeSpaNav = observeSpaNavigation((oldUrl, newUrl) => {
      if (shouldInvalidateLinkedInCache(oldUrl, newUrl)) {
        this.invalidateProfileCache();
      }
    });
  }

  private invalidateProfileCache(): void {
    this.currentData = null;
    this.currentAdapter = null;
    const adapter = resolvePlatform();
    if (adapter) this.currentAdapter = adapter;
  }

  private async setupUI(): Promise<void> {
    // UI только через popup
  }

  triggerImport(payload?: {
    vacancyId?: string;
    globalCandidateId?: string;
  }): Promise<void> {
    return this.handleImport(payload);
  }

  /** Проверяет, актуальны ли закэшированные данные (URL страницы не изменился) */
  private isCacheStale(): boolean {
    if (!this.currentData?.profileUrl) return false;
    const current = typeof window !== "undefined" ? window.location.href : "";
    return current !== this.currentData.profileUrl;
  }

  private async ensureDataAndCheckDuplicate(): Promise<
    | { ok: true; data: CandidateData; duplicate: false }
    | {
        ok: true;
        data: CandidateData;
        duplicate: true;
        existingCandidate: unknown;
      }
    | { ok: false; error: string }
  > {
    if (this.isCacheStale()) this.invalidateProfileCache();

    let data = this.currentData;
    if (!data) {
      if (!this.currentAdapter) {
        return { ok: false, error: "Страница не поддерживается для импорта" };
      }
      try {
        data = await extractCandidateData(this.currentAdapter);
        if (data) this.currentData = data;
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Не удалось извлечь данные профиля";
        return { ok: false, error: msg };
      }
    }
    if (!data) {
      return {
        ok: false,
        error:
          "Не удалось извлечь данные профиля. Попробуйте обновить страницу.",
      };
    }
    try {
      const duplicateResult = await checkDuplicateCandidate(data);
      if (duplicateResult.existing && duplicateResult.candidate) {
        return {
          ok: true,
          data,
          duplicate: true,
          existingCandidate: duplicateResult.candidate,
        };
      }
      return { ok: true, data, duplicate: false };
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Ошибка проверки дубликата";
      return { ok: false, error: msg };
    }
  }

  async checkAndImport(payload: {
    vacancyId: string;
  }): Promise<
    | { ok: true; duplicate: false }
    | { ok: true; duplicate: true; existingCandidate: unknown }
    | { ok: false; error: string }
  > {
    const result = await this.ensureDataAndCheckDuplicate();
    if (!result.ok) return result;
    if (result.duplicate) {
      return {
        ok: true,
        duplicate: true,
        existingCandidate: result.existingCandidate,
      };
    }
    const sanitizedData = this.normalizeFullName(result.data);
    const {
      skillsHtml: linkedInSkillsHtml,
      contactsHtml: linkedInContactsHtml,
    } = extractAndSanitizeLinkedInHtml(
      this.currentAdapter as LinkedInHtmlAdapter,
    );
    try {
      await importCandidateData(sanitizedData, {
        vacancyId: payload.vacancyId,
        linkedInSkillsHtml: linkedInSkillsHtml ?? undefined,
        linkedInContactsHtml: linkedInContactsHtml ?? undefined,
      });
      return { ok: true, duplicate: false };
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Не удалось импортировать";
      showNotification({ type: "error", message: msg });
      return { ok: false, error: msg };
    }
  }

  async triggerImportToVacancyExisting(payload: {
    vacancyId: string;
    globalCandidateId: string;
  }): Promise<void> {
    if (this.isCacheStale()) this.invalidateProfileCache();
    let data = this.currentData;
    if (!data) {
      if (!this.currentAdapter) {
        showNotification({
          type: "error",
          message: "Страница не поддерживается для импорта",
        });
        throw new Error("Страница не поддерживается");
      }
      data = await extractCandidateData(this.currentAdapter);
      if (data) this.currentData = data;
    }
    if (!data) {
      throw new Error("Не удалось извлечь данные профиля");
    }
    const {
      skillsHtml: linkedInSkillsHtml,
      contactsHtml: linkedInContactsHtml,
    } = extractAndSanitizeLinkedInHtml(
      this.currentAdapter as LinkedInHtmlAdapter,
    );
    await importToVacancyWithExisting(data, {
      ...payload,
      linkedInSkillsHtml: linkedInSkillsHtml ?? undefined,
      linkedInContactsHtml: linkedInContactsHtml ?? undefined,
    });
  }

  async triggerSaveToGlobalExisting(payload: {
    globalCandidateId: string;
    workspaceId: string;
    platformSource?: string;
  }): Promise<void> {
    await importToGlobalOnly(payload);
  }

  /** Максимальная длина имени кандидата при санитизации. */
  private static readonly MAX_CANDIDATE_NAME_LENGTH = 100;

  /**
   * Санитизирует имя: убирает управляющие/HTML-символы, нормализует пробелы,
   * обрезает пунктуацию по краям, ограничивает длину. Возвращает "Кандидат" если пусто.
   */
  private sanitizeCandidateName(name: string): string {
    if (typeof name !== "string") return "Кандидат";
    // Удаляем управляющие символы (0x00-0x1F, 0x7F) и HTML-теги
    let s = name
      .replace(/<[^>]*>/g, "")
      .split("")
      .filter((c) => {
        const code = c.charCodeAt(0);
        return (code > 0x1f && code !== 0x7f) || code === 0x20;
      })
      .join("");
    // Нормализуем пробелы (множественные -> один, trim)
    s = s.replace(/\s+/g, " ").trim();
    // Обрезаем пунктуацию по краям (.,;:!?-—_ и пробелы)
    s = s.replace(/^[\s.,;:!?\-—_\u2014]+|[\s.,;:!?\-—_\u2014]+$/g, "").trim();
    if (!s) return "Кандидат";
    return s.length > ContentScript.MAX_CANDIDATE_NAME_LENGTH
      ? s.slice(0, ContentScript.MAX_CANDIDATE_NAME_LENGTH)
      : s;
  }

  /**
   * Fallback для имени, когда контакты и fullName недоступны (частый случай на HH).
   * Пытается извлечь имя из страницы или возвращает "Кандидат".
   * Результат всегда санитизирован.
   */
  private getFallbackCandidateName(): string {
    if (typeof document === "undefined") return "Кандидат";
    // HH: data-qa="resume-personal-name"
    const hhName = document
      .querySelector('[data-qa="resume-personal-name"]')
      ?.textContent?.trim();
    if (hhName) return this.sanitizeCandidateName(hhName);
    // Заголовок страницы: "Резюме: Иванов Иван — HeadHunter"
    const titleMatch = document.title?.match(/Резюме:\s*(.+?)(?:\s*[-—]|$)/);
    if (titleMatch?.[1])
      return this.sanitizeCandidateName(titleMatch[1].trim());
    return "Кандидат";
  }

  /**
   * Вычисляет имя кандидата: fullName из данных или fallback из DOM.
   * Результат всегда санитизирован.
   */
  private getFreelancerName(data: CandidateData): string {
    const raw =
      data.basicInfo.fullName?.trim() || this.getFallbackCandidateName();
    return this.sanitizeCandidateName(raw);
  }

  /**
   * Нормализует fullName в данных кандидата: санитизация и fallback при пустом/некорректном.
   * Единая реализация для sanitizedData и handleImport.
   */
  private normalizeFullName(data: CandidateData): CandidateData {
    return {
      ...data,
      basicInfo: {
        ...data.basicInfo,
        fullName: this.getFreelancerName(data),
      },
    };
  }

  private prepareCandidatePayload(data: CandidateData): {
    platformSource: string;
    profileUrl: string | undefined;
    responseText: string;
  } {
    const platformLower = data.platform?.toLowerCase() ?? "";
    const platformSource =
      platformLower.includes("headhunter") || platformLower.includes("hh")
        ? "HH"
        : platformLower.includes("linkedin")
          ? "LINKEDIN"
          : "WEB_LINK";
    const profileUrl =
      data.profileUrl ||
      (typeof window !== "undefined" ? window.location.href : undefined);
    const responseText = buildResponseText(data, platformSource);
    return {
      platformSource,
      profileUrl,
      responseText,
    };
  }

  async checkAndSaveToGlobal(payload: {
    workspaceId: string;
  }): Promise<
    | { ok: true; duplicate: false }
    | { ok: true; duplicate: true; existingCandidate: unknown }
    | { ok: false; error: string }
  > {
    const result = await this.ensureDataAndCheckDuplicate();
    if (!result.ok) return result;
    if (result.duplicate) {
      return {
        ok: true,
        duplicate: true,
        existingCandidate: result.existingCandidate,
      };
    }
    try {
      const { platformSource, profileUrl, responseText } =
        this.prepareCandidatePayload(result.data);
      const freelancerName = this.getFreelancerName(result.data);
      await importToGlobalOnly({
        workspaceId: payload.workspaceId,
        candidateData: {
          platformSource,
          freelancerName: freelancerName || undefined,
          contactInfo: {
            email: result.data.contacts?.email || undefined,
            phone: result.data.contacts?.phone || undefined,
            platformProfileUrl: profileUrl,
          },
          responseText,
        },
      });
      return { ok: true, duplicate: false };
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Не удалось сохранить";
      showNotification({ type: "error", message: msg });
      return { ok: false, error: msg };
    }
  }

  async triggerSaveToGlobalOnly(payload: {
    workspaceId: string;
  }): Promise<void> {
    if (this.isCacheStale()) this.invalidateProfileCache();
    let data = this.currentData;
    if (!data) {
      if (!this.currentAdapter) {
        showNotification({
          type: "error",
          message: "Страница не поддерживается для импорта",
        });
        throw new Error("Страница не поддерживается");
      }
      data = await extractCandidateData(this.currentAdapter);
      if (data) this.currentData = data;
    }
    if (!data) {
      throw new Error("Не удалось извлечь данные профиля");
    }
    const { platformSource, profileUrl, responseText } =
      this.prepareCandidatePayload(data);
    const freelancerName = this.getFreelancerName(data);
    await importToGlobalOnly({
      workspaceId: payload.workspaceId,
      candidateData: {
        platformSource,
        freelancerName: freelancerName || undefined,
        contactInfo: {
          email: data.contacts?.email || undefined,
          phone: data.contacts?.phone || undefined,
          platformProfileUrl: profileUrl,
        },
        responseText,
      },
    });
  }

  private async handleImport(payload?: {
    vacancyId?: string;
    globalCandidateId?: string;
  }): Promise<void> {
    if (this.isCacheStale()) this.invalidateProfileCache();
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
    data = this.normalizeFullName(data);
    const {
      skillsHtml: linkedInSkillsHtml,
      contactsHtml: linkedInContactsHtml,
    } = extractAndSanitizeLinkedInHtml(
      this.currentAdapter as LinkedInHtmlAdapter,
    );
    try {
      await importCandidateData(data, {
        vacancyId: payload?.vacancyId,
        globalCandidateId: payload?.globalCandidateId,
        linkedInSkillsHtml: linkedInSkillsHtml ?? undefined,
        linkedInContactsHtml: linkedInContactsHtml ?? undefined,
      });
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Не удалось импортировать";
      showNotification({ type: "error", message: msg });
      throw new Error(msg);
    }
  }

  cleanup(): void {
    this.unsubscribeSpaNav?.();
    this.unsubscribeSpaNav = null;
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
    "IMPORT_TO_SYSTEM",
    "CHECK_AND_IMPORT",
    "CHECK_AND_SAVE_TO_GLOBAL",
    "IMPORT_TO_VACANCY_EXISTING",
    "SAVE_TO_GLOBAL_EXISTING",
    "SAVE_TO_GLOBAL_ONLY",
  ] as const;

  chrome.runtime.onMessage.addListener(
    (msg: { type?: string; payload?: unknown }, _s, sendResponse) => {
      const t = msg?.type;
      if (!t || !(MESSAGE_TYPES as readonly string[]).includes(t)) return false;

      const run = async () => {
        try {
          const payload = msg?.payload as
            | { vacancyId?: string; globalCandidateId?: string }
            | { vacancyId: string }
            | { vacancyId: string; globalCandidateId: string }
            | { globalCandidateId: string; workspaceId: string }
            | undefined;

          if (t === "IMPORT_TO_SYSTEM") {
            await contentScript.triggerImport(payload);
            return { ok: true as const };
          }
          if (
            t === "CHECK_AND_IMPORT" &&
            payload &&
            "vacancyId" in payload &&
            typeof payload.vacancyId === "string"
          ) {
            return await contentScript.checkAndImport({
              vacancyId: payload.vacancyId,
            });
          }
          if (
            t === "CHECK_AND_SAVE_TO_GLOBAL" &&
            payload &&
            "workspaceId" in payload &&
            typeof (payload as { workspaceId: string }).workspaceId === "string"
          ) {
            return await contentScript.checkAndSaveToGlobal({
              workspaceId: (payload as { workspaceId: string }).workspaceId,
            });
          }
          if (t === "IMPORT_TO_VACANCY_EXISTING" && payload) {
            const p = payload as Record<string, unknown>;
            if (
              typeof p.vacancyId === "string" &&
              typeof p.globalCandidateId === "string"
            ) {
              await contentScript.triggerImportToVacancyExisting({
                vacancyId: p.vacancyId,
                globalCandidateId: p.globalCandidateId,
              });
              return { ok: true as const };
            }
          }
          if (
            t === "SAVE_TO_GLOBAL_EXISTING" &&
            payload &&
            "globalCandidateId" in payload &&
            "workspaceId" in payload
          ) {
            await contentScript.triggerSaveToGlobalExisting(payload);
            return { ok: true as const };
          }
          if (
            t === "SAVE_TO_GLOBAL_ONLY" &&
            payload &&
            "workspaceId" in payload
          ) {
            await contentScript.triggerSaveToGlobalOnly(payload);
            return { ok: true as const };
          }
          return { ok: false as const, error: "Некорректный payload" };
        } catch (e) {
          return { ok: false as const, error: String(e) };
        }
      };
      run().then(sendResponse);
      return true;
    },
  );
}
