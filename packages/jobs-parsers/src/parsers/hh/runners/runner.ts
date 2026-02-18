import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { validateCredentials } from "../core/auth/auth";
import { setupPageWithAuth } from "../core/browser/browser-setup";
import { closeBrowserSafely } from "../core/browser/browser-utils";
import { parseResponses } from "../parsers/response/response-parser";
import {
  parseArchivedVacancies,
  parseVacancies,
} from "../parsers/vacancy/vacancy-parser";

interface RunHHParserOptions {
  workspaceId: string;
  skipResponses?: boolean;
  includeArchived?: boolean;
}

interface ParserResult {
  imported: number;
  updated: number;
  failed: number;
}

export async function runHHParser(
  options: RunHHParserOptions,
): Promise<ParserResult> {
  const {
    workspaceId,
    skipResponses = false,
    includeArchived = false,
  } = options;

  console.log("🚀 Запуск HH парсера");
  console.log(`   Workspace: ${workspaceId}`);
  console.log(`   Пропустить отклики: ${skipResponses}`);
  console.log(`   Включить архивные вакансии: ${includeArchived}`);

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
    let totalImported = 0;
    let totalUpdated = 0;
    let totalFailed = 0;

    // Получаем план организации (воркспейс наследует план организации)
    const workspaceData = await db.query.workspace.findFirst({
      where: (w, { eq }) => eq(w.id, workspaceId),
      columns: { plan: true },
      with: { organization: { columns: { plan: true } } },
    });

    const organizationPlan = workspaceData?.organization?.plan ?? "free";

    const vacanciesResult = await parseVacancies(page, workspaceId);
    totalImported += vacanciesResult.imported;
    totalUpdated += vacanciesResult.updated;
    totalFailed += vacanciesResult.failed;

    if (!skipResponses && vacanciesResult.vacancies.length > 0) {
      console.log("\n📨 Парсинг откликов активных вакансий...");

      for (const vacancy of vacanciesResult.vacancies) {
        if (vacancy.responsesUrl && vacancy.externalId) {
          try {
            await parseResponses(
              page,
              vacancy.responsesUrl,
              vacancy.externalId,
              vacancy.id || "",
              undefined,
              organizationPlan,
            );
          } catch (error) {
            console.error(
              `❌ Ошибка парсинга откликов вакансии ${vacancy.externalId}:`,
              error,
            );
            totalFailed++;
          }
        }
      }
    }

    if (includeArchived) {
      console.log("\n📦 Парсинг архивных вакансий...");

      const archivedResult = await parseArchivedVacancies(page, workspaceId);
      totalImported += archivedResult.imported;
      totalUpdated += archivedResult.updated;
      totalFailed += archivedResult.failed;

      if (!skipResponses && archivedResult.vacancies.length > 0) {
        console.log("\n📨 Парсинг откликов архивных вакансий...");

        for (const vacancy of archivedResult.vacancies) {
          if (vacancy.responsesUrl && vacancy.externalId) {
            try {
              await parseResponses(
                page,
                vacancy.responsesUrl,
                vacancy.externalId,
                vacancy.id || "",
                undefined,
                workspaceData?.plan,
              );
            } catch (error) {
              console.error(
                `❌ Ошибка парсинга откликов архивной вакансии ${vacancy.externalId}:`,
                error,
              );
              totalFailed++;
            }
          }
        }
      }
    }

    console.log("\n🎉 Парсинг завершен!");
    console.log(`   Импортировано: ${totalImported}`);
    console.log(`   Обновлено: ${totalUpdated}`);
    console.log(`   Ошибок: ${totalFailed}`);

    return {
      imported: totalImported,
      updated: totalUpdated,
      failed: totalFailed,
    };
  } finally {
    await closeBrowserSafely(browser);
  }
}
