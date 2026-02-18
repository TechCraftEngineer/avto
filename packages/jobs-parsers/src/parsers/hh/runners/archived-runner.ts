import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import type { VacancyData } from "../../types";
import { validateCredentials } from "../core/auth/auth";
import { setupPageWithAuth } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";
import { fetchArchivedVacanciesList } from "../fetchers/fetch-archived-vacancy-list";
import { fetchActiveVacanciesList } from "../fetchers/fetch-active-vacancy-list";
import { parseArchivedVacancyResponses } from "../parsers/response/archived-response-parser";
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

export async function runHHArchivedVacancyParser(
  options: RunHHArchivedVacancyParserOptions,
): Promise<{ syncedResponses: number; newResponses: number }> {
  const { workspaceId, vacancyId, externalId, onProgress } = options;

  console.log("🚀 Запуск HH парсера для архивной вакансии");
  console.log(`   Workspace: ${workspaceId}`);
  console.log(`   Vacancy: ${vacancyId}`);
  console.log(`   External ID: ${externalId}`);

  // Получаем план workspace
  const workspaceData = await db.query.workspace.findFirst({
    where: (w, { eq }) => eq(w.id, workspaceId),
    columns: {
      plan: true,
    },
  });

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  validateCredentials(credentials);

  // Используем пустую строку для пароля, если его нет
  const password = credentials.password || "";

  const { browser, page } = await setupPageWithAuth(
    workspaceId,
    credentials.email!,
    password,
  );

  try {
    // Парсим отклики для конкретной архивной вакансии
    const result = await parseArchivedVacancyResponses(
      page,
      vacancyId,
      externalId,
      workspaceData?.plan,
      onProgress,
    );

    console.log("✅ Парсинг архивной вакансии завершен успешно");
    console.log(`   Синхронизировано откликов: ${result.syncedResponses}`);
    console.log(`   Новых откликов: ${result.newResponses}`);

    return result;
  } catch (error) {
    console.error("❌ Ошибка при парсинге архивной вакансии:", error);
    throw error;
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

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  validateCredentials(credentials);

  const password = credentials.password || "";

  const { browser, page } = await setupPageWithAuth(
    workspaceId,
    credentials.email!,
    password,
  );

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

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  validateCredentials(credentials);

  const password = credentials.password || "";

  const { browser, page } = await setupPageWithAuth(
    workspaceId,
    credentials.email!,
    password,
  );

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

