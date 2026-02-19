import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import type { VacancyData } from "../../types";
import { validateCredentials } from "../core/auth/auth";
import { setupPageWithAuth } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";
import { HH_CONFIG } from "../core/config/config";
import {
  parseArchivedVacancyResponses,
  parseArchivedVacancyResponsesPage,
  type SyncArchivedPageOptions,
} from "../parsers/response/archived-response-parser";
import { parseResponseDetailsForVacancy } from "../parsers/response/response-utils";
import { parseSingleVacancy } from "../parsers/vacancy/vacancy-parser";

export { fetchActiveVacanciesList } from "../fetchers/fetch-active-vacancy-list";
export { fetchArchivedVacanciesList } from "../fetchers/fetch-archived-vacancy-list";

export interface RunHHArchivedVacancyParserOptions {
  workspaceId: string;
  vacancyId: string;
  externalId?: string | null;
  onProgress?: (
    processed: number,
    total: number,
    newCount: number,
    currentName?: string,
  ) => Promise<void>;
}

export interface RunHHArchivedVacancyParserPageOptions {
  workspaceId: string;
  vacancyId: string;
  externalId?: string | null;
  pageOptions: SyncArchivedPageOptions;
  onProgress?: (
    processed: number,
    total: number,
    newCount: number,
    currentName?: string,
  ) => Promise<void>;
}

/**
 * Результат настройки браузера для парсинга HH
 */
interface BrowserSetupResult {
  browser: Awaited<ReturnType<typeof setupPageWithAuth>>["browser"];
  page: Awaited<ReturnType<typeof setupPageWithAuth>>["page"];
  organizationPlan: "free" | "starter" | "pro" | "enterprise";
}

/**
 * Настраивает браузер с авторизацией для парсинга HH.
 * Возвращает браузер, страницу и план организации.
 */
async function setupBrowserForWorkspace(
  workspaceId: string,
): Promise<BrowserSetupResult> {
  const workspaceData = await db.query.workspace.findFirst({
    where: (w, { eq }) => eq(w.id, workspaceId),
    columns: { plan: true },
    with: { organization: { columns: { plan: true } } },
  });

  const organizationPlan = workspaceData?.organization?.plan ?? "free";

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  validateCredentials(credentials);

  const password = credentials.password || "";
  const { browser, page } = await setupPageWithAuth(
    workspaceId,
    credentials.email,
    password,
  );

  return { browser, page, organizationPlan };
}

export async function runHHArchivedVacancyParser(
  options: RunHHArchivedVacancyParserOptions,
): Promise<{ syncedResponses: number; newResponses: number }> {
  const { workspaceId, vacancyId, externalId, onProgress } = options;

  console.log("🚀 Запуск HH парсера для архивной вакансии");
  console.log(`   Workspace: ${workspaceId}`);
  console.log(`   Vacancy: ${vacancyId}`);
  console.log(`   External ID: ${externalId}`);

  const { browser, page, organizationPlan } =
    await setupBrowserForWorkspace(workspaceId);

  try {
    const result = await parseArchivedVacancyResponses(
      page,
      vacancyId,
      externalId,
      organizationPlan,
      onProgress,
    );

    console.log("✅ Парсинг архивной вакансии завершен успешно");

    return result;
  } catch (error) {
    console.error("❌ Ошибка при парсинге архивной вакансии:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * Синхронизирует одну страницу откликов архивной вакансии.
 * Используется для возобновляемой загрузки в Inngest step loop.
 */
export async function runHHArchivedVacancyParserPage(
  options: RunHHArchivedVacancyParserPageOptions,
): Promise<{
  syncedResponses: number;
  newResponses: number;
  hasMore: boolean;
}> {
  const {
    workspaceId,
    vacancyId,
    externalId,
    pageOptions,
    onProgress,
  } = options;

  console.log(
    `🚀 Синхронизация страницы ${pageOptions.pageIndex} для архивной вакансии ${vacancyId}`,
  );

  const { browser, page, organizationPlan } =
    await setupBrowserForWorkspace(workspaceId);

  try {
    const responsesUrl = `${HH_CONFIG.urls.baseUrl}/employer/vacancyresponses?vacancyId=${externalId}`;

    const result = await parseArchivedVacancyResponsesPage(
      page,
      responsesUrl,
      vacancyId,
      organizationPlan,
      pageOptions,
      onProgress,
    );

    console.log(
      `✅ Страница ${pageOptions.pageIndex}: ${result.syncedResponses} откликов, новых: ${result.newResponses}`,
    );

    return result;
  } catch (error) {
    console.error("❌ Ошибка при парсинге архивной вакансии:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * Парсит детальную информацию резюме для откликов вакансии.
 * Используется после постраничной синхронизации в отдельном Inngest step.
 */
export async function runHHParseResponseDetailsForVacancy(
  workspaceId: string,
  vacancyId: string,
  onProgress?: (
    processed: number,
    total: number,
    currentName?: string,
  ) => Promise<void>,
): Promise<void> {
  const { browser, page } = await setupBrowserForWorkspace(workspaceId);

  try {
    await parseResponseDetailsForVacancy(page, vacancyId, onProgress);
  } finally {
    await closeBrowserSafely(browser);
  }
}

export async function importMultipleVacancies(
  workspaceId: string,
  vacancies: { url: string; date?: string; region?: string }[],
  onProgress?: (
    index: number,
    success: boolean,
    error?: string,
  ) => Promise<void>,
  options?: { isArchived?: boolean },
): Promise<{ imported: number; updated: number; failed: number }> {
  const isArchived = options?.isArchived ?? true;
  console.log(
    `📦 Импорт ${vacancies.length} ${isArchived ? "архивных" : "активных"} вакансий`,
  );

  const { browser, page } = await setupBrowserForWorkspace(workspaceId);

  try {
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < vacancies.length; i++) {
      const vacancy = vacancies[i];
      if (!vacancy) continue;

      try {
        console.log(
          `📄 Импорт вакансии ${i + 1}/${vacancies.length}: ${vacancy.url}`,
        );
        const result = await parseSingleVacancy(
          page,
          vacancy.url,
          workspaceId,
          isArchived,
          vacancy.region,
        );

        if (result.success) {
          imported++;
          await onProgress?.(i, true);
        } else {
          failed++;
          await onProgress?.(i, false, "Не удалось импортировать вакансию");
        }
      } catch (error) {
        console.error(`❌ Ошибка импорта вакансии ${vacancy.url}:`, error);
        failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Неизвестная ошибка";
        await onProgress?.(i, false, errorMessage);
      }
    }

    console.log(
      `✅ Импорт завершен: ${imported} импортировано, ${failed} ошибок`,
    );

    return { imported, updated: 0, failed };
  } finally {
    await closeBrowserSafely(browser);
  }
}

export async function importSingleVacancy(
  workspaceId: string,
  url: string,
): Promise<{ success: boolean; vacancy?: VacancyData; isNew?: boolean }> {
  console.log(`🔍 Импорт отдельной вакансии: ${url}`);

  const { browser, page } = await setupBrowserForWorkspace(workspaceId);

  try {
    const result = await parseSingleVacancy(page, url, workspaceId);

    return {
      success: result.success,
      vacancy: result.vacancy || undefined,
      isNew: result.isNew,
    };
  } finally {
    await closeBrowserSafely(browser);
  }
}

