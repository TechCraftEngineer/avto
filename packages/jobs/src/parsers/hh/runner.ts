import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import puppeteer from "puppeteer";
import { checkAndPerformLogin, loadCookies } from "./auth";
import { closeBrowserSafely } from "./browser-utils";
import { HH_CONFIG } from "./config";
import { parseResponses } from "./response-parser";
import {
  parseArchivedVacancies,
  parseSingleVacancy,
  parseVacancies,
} from "./vacancy-parser";

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
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  const browser = await puppeteer.launch(HH_CONFIG.puppeteer);

  try {
    const page = await browser.newPage();

    await page.setUserAgent(HH_CONFIG.userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    // Load existing cookies if available
    const savedCookies = await loadCookies("hh", workspaceId);
    if (savedCookies && savedCookies.length > 0) {
      await page.setCookie(...savedCookies);
    }

    // Check authentication and perform login if needed
    const loggedIn = await checkAndPerformLogin(
      page,
      credentials.email,
      credentials.password,
      workspaceId,
    );

    if (!loggedIn) {
      throw new Error("Не удалось войти в систему HeadHunter");
    }

    let totalImported = 0;
    let totalUpdated = 0;
    let totalFailed = 0;

    const vacanciesResult = await parseVacancies(page, workspaceId);
    totalImported += vacanciesResult.imported;
    totalUpdated += vacanciesResult.updated;
    totalFailed += vacanciesResult.failed;

    if (!skipResponses && vacanciesResult.vacancies.length > 0) {
      console.log("\n📨 Парсинг откликов активных вакансий...");

      for (const vacancy of vacanciesResult.vacancies) {
        if (vacancy.responsesUrl) {
          try {
            await parseResponses(page, vacancy.responsesUrl, vacancy.id);
          } catch (error) {
            console.error(
              `❌ Ошибка парсинга откликов для ${vacancy.title}:`,
              error,
            );
          }
        }
      }
    }

    // Парсинг архивных вакансий, если запрошено
    if (includeArchived) {
      console.log("\n📁 Парсинг архивных вакансий...");
      const archivedResult = await parseArchivedVacancies(page, workspaceId);
      totalImported += archivedResult.imported;
      totalUpdated += archivedResult.updated;
      totalFailed += archivedResult.failed;

      if (!skipResponses && archivedResult.vacancies.length > 0) {
        console.log("\n📨 Парсинг откликов архивных вакансий...");

        for (const vacancy of archivedResult.vacancies) {
          if (vacancy.responsesUrl) {
            try {
              await parseResponses(page, vacancy.responsesUrl, vacancy.id);
            } catch (error) {
              console.error(
                `❌ Ошибка парсинга откликов для архивной вакансии ${vacancy.title}:`,
                error,
              );
            }
          }
        }
      }
    }

    console.log("✅ Парсинг завершен успешно");
    console.log(
      `📊 Статистика: импортировано ${totalImported}, обновлено ${totalUpdated}, ошибок ${totalFailed}`,
    );

    return {
      imported: totalImported,
      updated: totalUpdated,
      failed: totalFailed,
    };
  } catch (error) {
    console.error("❌ Ошибка при парсинге:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * Получает список архивных вакансий без полного импорта
 */
export async function fetchArchivedVacanciesList(workspaceId: string): Promise<
  Array<{
    externalId: string;
    title: string;
    responses: string;
    region: string;
  }>
> {
  console.log(`🚀 Получение списка архивных вакансий`);

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  const browser = await puppeteer.launch(HH_CONFIG.puppeteer);

  try {
    const page = await browser.newPage();

    await page.setUserAgent(HH_CONFIG.userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    // Load existing cookies if available
    const savedCookies = await loadCookies("hh", workspaceId);
    if (savedCookies && savedCookies.length > 0) {
      await page.setCookie(...savedCookies);
    }

    // Check authentication and perform login if needed
    const loggedIn = await checkAndPerformLogin(
      page,
      credentials.email,
      credentials.password,
      workspaceId,
    );

    if (!loggedIn) {
      throw new Error("Не удалось войти в систему HeadHunter");
    }

    // Переходим на страницу архивных вакансий
    await page.goto("https://hh.ru/employer/vacancies/archived", {
      waitUntil: "networkidle2",
    });

    // Ждем загрузки списка вакансий
    try {
      await page.waitForSelector(
        'div[data-qa^="vacancies-dashboard-vacancy"]',
        {
          timeout: 10000,
        },
      );
    } catch (_e) {
      // Нет архивных вакансий
      console.log("⚠️ Архивные вакансии не найдены");
      return [];
    }

    // Получаем список вакансий
    const vacancies = await page.$$eval(
      'div[data-qa^="vacancies-dashboard-vacancy"]',
      (elements: Element[]) => {
        return elements.map((el) => {
          const getText = (selector: string) => {
            const node = el.querySelector(selector);
            return node ? node.textContent?.trim() || "" : "";
          };

          // Извлекаем ID вакансии из data-vacancy-id или из data-qa атрибута
          let externalId = el.getAttribute("data-vacancy-id") || "";

          if (!externalId) {
            // Ищем элемент с data-qa, содержащим ID вакансии
            const nameElement = el.querySelector(
              '[data-qa^="vacancies-dashboard-vacancy--archive-name_"]',
            );
            if (nameElement) {
              const dataQa = nameElement.getAttribute("data-qa") || "";
              // Извлекаем ID из строки типа "vacancies-dashboard-vacancy--archive-name_128580152"
              const match = dataQa.match(/_(\d+)$/);
              if (match?.[1]) {
                externalId = match[1];
              }
            }
          }

          return {
            externalId,
            title: getText(
              '[data-qa^="vacancies-dashboard-vacancy--archive-name"]',
            ),
            responses: getText(
              '[data-qa="archived-vacancy-topics-count-text"]',
            ),

            region: getText(
              '[data-qa="table-flexible-cell-archiveVacancyArea"]',
            ),
          };
        });
      },
    );

    console.log(`✅ Получено ${vacancies.length} архивных вакансий`);

    return vacancies;
  } catch (error) {
    console.error("❌ Ошибка при получении списка архивных вакансий:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * Импортирует одну вакансию по её externalId
 */
export async function importSingleVacancy(
  workspaceId: string,
  externalId: string,
): Promise<{ vacancyId: string; isNew: boolean }> {
  console.log(`🚀 Импорт вакансии ${externalId}`);

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  const browser = await puppeteer.launch(HH_CONFIG.puppeteer);

  try {
    const page = await browser.newPage();

    await page.setUserAgent(HH_CONFIG.userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    // Load existing cookies if available
    const savedCookies = await loadCookies("hh", workspaceId);
    if (savedCookies && savedCookies.length > 0) {
      await page.setCookie(...savedCookies);
    }

    // Check authentication and perform login if needed
    const loggedIn = await checkAndPerformLogin(
      page,
      credentials.email,
      credentials.password,
      workspaceId,
    );

    if (!loggedIn) {
      throw new Error("Не удалось войти в систему HeadHunter");
    }

    const result = await parseSingleVacancy(page, externalId, workspaceId);

    console.log(
      `✅ Вакансия ${result.isNew ? "импортирована" : "обновлена"}: ${result.vacancyId}`,
    );

    return result;
  } catch (error) {
    console.error("❌ Ошибка при импорте вакансии:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}

/**
 * Импортирует несколько вакансий за один сеанс браузера
 * Оптимизировано для пакетного импорта - переиспользует браузер и аутентификацию
 */
export async function importMultipleVacancies(
  workspaceId: string,
  externalIds: string[],
): Promise<
  Array<{
    externalId: string;
    vacancyId?: string;
    isNew?: boolean;
    success: boolean;
    error?: string;
  }>
> {
  console.log(`🚀 Пакетный импорт ${externalIds.length} вакансий`);

  const credentials = await getIntegrationCredentials(db, "hh", workspaceId);
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  const browser = await puppeteer.launch(HH_CONFIG.puppeteer);
  const results: Array<{
    externalId: string;
    vacancyId?: string;
    isNew?: boolean;
    success: boolean;
    error?: string;
  }> = [];

  try {
    const page = await browser.newPage();

    await page.setUserAgent(HH_CONFIG.userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    // Load existing cookies if available
    const savedCookies = await loadCookies("hh", workspaceId);
    if (savedCookies && savedCookies.length > 0) {
      await page.setCookie(...savedCookies);
    }

    // Check authentication and perform login if needed
    const loggedIn = await checkAndPerformLogin(
      page,
      credentials.email,
      credentials.password,
      workspaceId,
    );

    if (!loggedIn) {
      throw new Error("Не удалось войти в систему HeadHunter");
    }

    // Импортируем каждую вакансию, переиспользуя страницу
    for (const externalId of externalIds) {
      try {
        const result = await parseSingleVacancy(page, externalId, workspaceId);
        results.push({
          externalId,
          vacancyId: result.vacancyId,
          isNew: result.isNew,
          success: true,
        });
        console.log(
          `✅ Вакансия ${result.isNew ? "импортирована" : "обновлена"}: ${result.vacancyId}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.push({
          externalId,
          success: false,
          error: errorMessage,
        });
        console.error(
          `❌ Ошибка импорта вакансии ${externalId}:`,
          errorMessage,
        );
      }
    }

    console.log(
      `✅ Пакетный импорт завершён: ${results.filter((r) => r.success).length}/${externalIds.length} успешно`,
    );

    return results;
  } catch (error) {
    console.error("❌ Критическая ошибка при пакетном импорте:", error);
    throw error;
  } finally {
    await closeBrowserSafely(browser);
  }
}
