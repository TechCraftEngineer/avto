import type { Page } from "puppeteer";
import {
  hasVacancyDescription,
  saveBasicVacancy,
  updateVacancyDescription,
} from "../../services/vacancy";
import type { VacancyData } from "../types";
import { HH_CONFIG } from "./config";
import { humanBrowse, humanDelay, randomDelay } from "./human-behavior";

export async function parseVacancies(
  page: Page,
  workspaceId: string,
): Promise<VacancyData[]> {
  console.log(`🚀 Начинаем парсинг активных вакансий`);

  // ЭТАП 1: Собираем список всех активных вакансий
  console.log("\n📋 ЭТАП 1: Сбор списка активных вакансий...");
  const vacancies = await collectVacancies(page);

  if (vacancies.length === 0) {
    console.log("⚠️ Не найдено активных вакансий");
    return [];
  }

  console.log(`✅ Найдено активных вакансий: ${vacancies.length}`);

  // ЭТАП 2: Сохраняем базовую информацию всех вакансий
  console.log("\n💾 ЭТАП 2: Сохранение базовой информации...");
  const newVacancyIds = await saveBasicVacancies(vacancies, workspaceId);

  // ЭТАП 3: Парсим описания для вакансий без описания
  console.log("\n📊 ЭТАП 3: Парсинг описаний вакансий...");
  await parseVacancyDescriptions(page, vacancies, newVacancyIds);

  console.log(`\n🎉 Парсинг активных вакансий завершен!`);

  return vacancies;
}

export async function parseArchivedVacancies(
  page: Page,
  workspaceId: string,
): Promise<VacancyData[]> {
  console.log(`🚀 Начинаем парсинг архивных вакансий`);

  // ЭТАП 1: Собираем список всех архивных вакансий
  console.log("\n📋 ЭТАП 1: Сбор списка архивных вакансий...");
  const archivedVacancies = await collectArchivedVacancies(page);

  if (archivedVacancies.length === 0) {
    console.log("⚠️ Не найдено архивных вакансий");
    return [];
  }

  console.log(`✅ Найдено архивных вакансий: ${archivedVacancies.length}`);

  // ЭТАП 2: Сохраняем базовую информацию всех вакансий
  console.log("\n💾 ЭТАП 2: Сохранение базовой информации...");
  const newVacancyIds = await saveBasicVacancies(
    archivedVacancies,
    workspaceId,
  );

  // ЭТАП 3: Парсим описания для вакансий без описания
  console.log("\n📊 ЭТАП 3: Парсинг описаний вакансий...");
  await parseVacancyDescriptions(page, archivedVacancies, newVacancyIds);

  console.log(`\n🎉 Парсинг архивных вакансий завершен!`);

  return archivedVacancies;
}

/**
 * ЭТАП 1: Собирает список всех активных вакансий
 */
async function collectVacancies(page: Page): Promise<VacancyData[]> {
  console.log(`📄 Переход на страницу вакансий: ${HH_CONFIG.urls.vacancies}`);

  await page.goto(HH_CONFIG.urls.vacancies, { waitUntil: "networkidle2" });

  // Пауза после загрузки страницы
  await humanDelay(1500, 3000);

  try {
    await page.waitForSelector('div[data-qa="vacancies-dashboard-vacancy"]', {
      timeout: HH_CONFIG.timeouts.selector,
    });
  } catch (_e) {
    console.log("⚠️ Не найдено активных вакансий на странице");
    return [];
  }

  // Имитируем просмотр списка вакансий
  await humanBrowse(page);

  const vacancies = await page.$$eval(
    'div[data-qa="vacancies-dashboard-vacancy"]',
    (elements: Element[]) => {
      return elements.map((el) => {
        const getText = (selector: string) => {
          const node = el.querySelector(selector);
          return node ? node.textContent?.trim() || "" : "";
        };

        const getAttr = (selector: string, attr: string) => {
          const node = el.querySelector(selector);
          return node ? node.getAttribute(attr) : "";
        };

        const cleanNumber = (text: string) => text.replace(/\D/g, "");

        return {
          id: el.getAttribute("data-vacancy-id") || "",
          externalId: el.getAttribute("data-vacancy-id") || "",
          title: getText('[data-qa="vacancies-dashboard-vacancy-name"]'),
          url: getAttr('[data-qa="vacancies-dashboard-vacancy-name"]', "href"),
          views: cleanNumber(
            getText(
              '[data-analytics-button-name="employer_vacancies_counter_views"]',
            ),
          ),
          responses: getText(
            '[data-qa="vacancies-dashboard-vacancy-responses-count-total"]',
          ),
          responsesUrl: getAttr(
            '[data-qa="vacancies-dashboard-vacancy-responses-count-link"]',
            "href",
          ),
          newResponses: getText(
            '[data-qa="vacancies-dashboard-vacancy-responses-count-new"]',
          ),
          resumesInProgress: cleanNumber(
            getText(
              '[data-qa="vacancies-dashboard-vacancy-resumes-in-progress-count"]',
            ),
          ),
          suitableResumes: cleanNumber(
            getText('[data-qa="suitable-resumes-count"]'),
          ),
          region: getText('[data-qa="table-flexible-cell-area"]'),
          description: "",
          source: "hh" as const,
        };
      });
    },
  );

  // Нормализуем URL вакансий
  for (const vacancy of vacancies) {
    if (vacancy.url) {
      vacancy.url = vacancy.url.startsWith("http")
        ? vacancy.url
        : new URL(vacancy.url, HH_CONFIG.urls.baseUrl).href;
    } else if (vacancy.externalId) {
      vacancy.url = `${HH_CONFIG.urls.baseUrl}/vacancy/${vacancy.externalId}`;
    }
  }

  return vacancies;
}

/**
 * ЭТАП 1: Собирает список всех архивных вакансий
 */
async function collectArchivedVacancies(page: Page): Promise<VacancyData[]> {
  console.log(
    `📄 Переход на страницу архивных вакансий: ${HH_CONFIG.urls.archivedVacancies}`,
  );

  await page.goto(HH_CONFIG.urls.archivedVacancies, {
    waitUntil: "networkidle2",
  });

  // Пауза после загрузки страницы
  await humanDelay(1500, 3000);

  try {
    await page.waitForSelector('div[data-qa="vacancies-dashboard-vacancy"]', {
      timeout: HH_CONFIG.timeouts.selector,
    });
  } catch (_e) {
    console.log("⚠️ Не найдено архивных вакансий на странице");
    return [];
  }

  // Имитируем просмотр списка вакансий
  await humanBrowse(page);

  const vacancies = await page.$$eval(
    'div[data-qa="vacancies-dashboard-vacancy"]',
    (elements: Element[]) => {
      return elements.map((el) => {
        const getText = (selector: string) => {
          const node = el.querySelector(selector);
          return node ? node.textContent?.trim() || "" : "";
        };

        const getAttr = (selector: string, attr: string) => {
          const node = el.querySelector(selector);
          return node ? node.getAttribute(attr) : "";
        };

        const cleanNumber = (text: string) => text.replace(/\D/g, "");

        return {
          id: el.getAttribute("data-vacancy-id") || "",
          externalId: el.getAttribute("data-vacancy-id") || "",
          title: getText('[data-qa="vacancies-dashboard-vacancy-name"]'),
          url: getAttr('[data-qa="vacancies-dashboard-vacancy-name"]', "href"),
          views: cleanNumber(
            getText(
              '[data-analytics-button-name="employer_vacancies_counter_views"]',
            ),
          ),
          responses: getText(
            '[data-qa="vacancies-dashboard-vacancy-responses-count-total"]',
          ),
          responsesUrl: getAttr(
            '[data-qa="vacancies-dashboard-vacancy-responses-count-link"]',
            "href",
          ),
          newResponses: getText(
            '[data-qa="vacancies-dashboard-vacancy-responses-count-new"]',
          ),
          resumesInProgress: cleanNumber(
            getText(
              '[data-qa="vacancies-dashboard-vacancy-resumes-in-progress-count"]',
            ),
          ),
          suitableResumes: cleanNumber(
            getText('[data-qa="suitable-resumes-count"]'),
          ),
          region: getText('[data-qa="table-flexible-cell-area"]'),
          description: "",
          source: "hh" as const,
        };
      });
    },
  );

  // Нормализуем URL вакансий
  for (const vacancy of vacancies) {
    if (vacancy.url) {
      vacancy.url = vacancy.url.startsWith("http")
        ? vacancy.url
        : new URL(vacancy.url, HH_CONFIG.urls.baseUrl).href;
    } else if (vacancy.externalId) {
      vacancy.url = `${HH_CONFIG.urls.baseUrl}/vacancy/${vacancy.externalId}`;
    }
  }

  return vacancies;
}

/**
 * ЭТАП 2: Сохраняет базовую информацию всех вакансий
 * Возвращает Set с ID новых вакансий
 */
async function saveBasicVacancies(
  vacancies: VacancyData[],
  workspaceId: string,
): Promise<Set<string>> {
  let savedCount = 0;
  let errorCount = 0;
  const newVacancyIds = new Set<string>();

  for (let i = 0; i < vacancies.length; i++) {
    const vacancy = vacancies[i];
    if (!vacancy) continue;

    const result = await saveBasicVacancy(vacancy, workspaceId);

    if (result.success) {
      const { vacancyId, isNew } = result.data;
      vacancy.id = vacancyId;
      if (isNew) newVacancyIds.add(vacancyId);
      savedCount++;
    } else {
      errorCount++;
      console.error(
        `❌ Ошибка сохранения вакансии ${vacancy.title}:`,
        result.error,
      );
      // Продолжаем работу со следующей вакансией
    }
  }

  console.log(
    `✅ Базовая информация: успешно ${savedCount}, ошибок ${errorCount}, новых ${newVacancyIds.size}`,
  );

  return newVacancyIds;
}

/**
 * ЭТАП 3: Парсит описания для вакансий без описания
 */
async function parseVacancyDescriptions(
  page: Page,
  vacancies: VacancyData[],
  newVacancyIds: Set<string>,
): Promise<void> {
  let parsedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < vacancies.length; i++) {
    const vacancy = vacancies[i];
    if (!vacancy || !vacancy.url) continue;

    try {
      // Проверяем, есть ли уже описание
      const hasDescriptionResult = await hasVacancyDescription(vacancy.id);

      if (!hasDescriptionResult.success) {
        errorCount++;
        console.error(
          `❌ Ошибка проверки описания ${vacancy.title}:`,
          hasDescriptionResult.error,
        );
        continue;
      }

      if (hasDescriptionResult.data) {
        skippedCount++;
        console.log(
          `⏭️ Пропуск ${i + 1}/${vacancies.length}: ${vacancy.title} (описание есть)`,
        );
        continue;
      }

      const isNewVacancy = newVacancyIds.has(vacancy.id);
      console.log(
        `\n📊 Парсинг описания ${i + 1}/${vacancies.length}: ${vacancy.title}${isNewVacancy ? " [НОВАЯ]" : ""}`,
      );

      // Задержка между просмотром вакансий
      if (parsedCount > 0) {
        const delay = randomDelay(2000, 5000);
        console.log(
          `⏳ Пауза ${Math.round(delay / 1000)}с перед следующей вакансией...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const description = await parseVacancyDetails(page, vacancy.url);

      if (description) {
        const updateResult = await updateVacancyDescription(
          vacancy.id,
          description,
          isNewVacancy,
        );

        if (updateResult.success) {
          vacancy.description = description;
          parsedCount++;
          console.log(
            `✅ Описание ${i + 1}/${vacancies.length} обработано успешно${isNewVacancy ? " (запущена генерация требований)" : ""}`,
          );
        } else {
          errorCount++;
          console.error(
            `❌ Ошибка обновления описания ${vacancy.title}:`,
            updateResult.error,
          );
        }
      } else {
        console.log(`⚠️ Пустое описание для ${vacancy.title}`);
      }
    } catch (error) {
      errorCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Ошибка парсинга описания ${vacancy.title}:`,
        errorMessage,
      );

      // Пауза после ошибки перед следующей попыткой
      console.log(`⏭️ Переход к следующей вакансии...`);
      await humanDelay(2000, 4000);
    }
  }

  console.log(
    `✅ Итого описания: успешно ${parsedCount}, пропущено ${skippedCount}, ошибок ${errorCount}`,
  );
}

/**
 * Парсит детальную страницу вакансии и извлекает описание
 */
async function parseVacancyDetails(page: Page, url: string): Promise<string> {
  console.log(`📄 Переход на детальную страницу: ${url}`);
  await page.goto(url, { waitUntil: "networkidle2" });

  // Пауза после загрузки
  await humanDelay(1000, 2500);

  try {
    await page.waitForSelector(".vacancy-section", {
      timeout: HH_CONFIG.timeouts.selector,
    });

    // Имитируем чтение описания вакансии
    await humanBrowse(page);

    const htmlContent = await page.$eval(
      ".vacancy-section",
      (el) => (el as HTMLElement).innerHTML,
    );

    return htmlContent.trim();
  } catch (_e) {
    console.log("⚠️ Не удалось получить описание вакансии.");
    return "";
  }
}

/**
 * Парсит одну вакансию по её externalId
 */
export async function parseSingleVacancy(
  page: Page,
  externalId: string,
  workspaceId: string,
): Promise<{ vacancyId: string; isNew: boolean }> {
  const url = `${HH_CONFIG.urls.baseUrl}/vacancy/${externalId}`;

  console.log(`📄 Парсинг вакансии: ${url}`);

  // Получаем описание вакансии
  const description = await parseVacancyDetails(page, url);

  if (!description) {
    throw new Error("Не удалось получить описание вакансии");
  }

  // Получаем заголовок вакансии
  await page.goto(url, { waitUntil: "networkidle2" });
  await humanDelay(1000, 2500);

  const title = await page
    .$eval('[data-qa="vacancy-title"]', (el) => el.textContent?.trim() || "")
    .catch(() => "");

  if (!title) {
    throw new Error("Не удалось получить название вакансии");
  }

  // Создаем объект вакансии
  const vacancyData: VacancyData = {
    id: externalId,
    externalId,
    title,
    url,
    description,
    source: "hh" as const,
    views: "0",
    responses: "0",
    newResponses: "0",
    resumesInProgress: "0",
    suitableResumes: "0",
    region: "",
    responsesUrl: "",
  };

  // Сохраняем вакансию
  const result = await saveBasicVacancy(vacancyData, workspaceId);

  if (!result.success) {
    throw new Error(result.error || "Ошибка сохранения вакансии");
  }

  const { vacancyId, isNew } = result.data;

  // Обновляем описание
  const updateResult = await updateVacancyDescription(
    vacancyId,
    description,
    isNew,
  );

  if (!updateResult.success) {
    throw new Error(updateResult.error || "Ошибка обновления описания");
  }

  return { vacancyId, isNew };
}
