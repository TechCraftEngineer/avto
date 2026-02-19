import { eq, getIntegrationCredentials } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { updateVacancyDescription } from "@qbs-autonaim/jobs/services/vacancy";
import { extractVacancyDataWithAI } from "../../parsers/hh/parsers/vacancy/ai-vacancy-extractor";
import { validateCredentials } from "../../parsers/hh/core/auth/auth";
import { setupPageWithAuth } from "../../parsers/hh/core/browser/browser-setup";
import { closeBrowserSafely } from "../../parsers/hh/core/browser/browser-utils";

/**
 * Функция Inngest для обновления одиночной вакансии
 * Загружает свежее описание с HH.ru через AI-парсер и запускает генерацию требований
 */
export const updateSingleVacancyFunction = inngest.createFunction(
  {
    id: "update-single-vacancy",
    name: "Update Single Vacancy",
    retries: 2,
  },
  { event: "vacancy/update.single" },
  async ({ event, step }) => {
    const { vacancyId } = event.data;

    return await step.run("update-vacancy", async () => {
      console.log(`🚀 Обновление вакансии ${vacancyId}`);

      const existingVacancy = await db.query.vacancy.findFirst({
        where: eq(vacancy.id, vacancyId),
      });

      if (!existingVacancy) {
        throw new Error(`Вакансия ${vacancyId} не найдена`);
      }

      if (!existingVacancy.url) {
        throw new Error(`У вакансии ${vacancyId} нет URL`);
      }

      const credentials = await getIntegrationCredentials(
        db,
        "hh",
        existingVacancy.workspaceId,
      );

      if (!credentials) {
        throw new Error("Не найдены учетные данные HH.ru для workspace");
      }

      validateCredentials(credentials);

      const password = credentials.password || "";

      const { browser, page } = await setupPageWithAuth(
        existingVacancy.workspaceId,
        credentials.email,
        password,
      );

      try {
        console.log(`📥 Парсинг описания с ${existingVacancy.url}`);

        const vacancyData = await extractVacancyDataWithAI(
          page,
          existingVacancy.url,
          {
            isArchived: !existingVacancy.isActive,
            region: existingVacancy.region ?? undefined,
          },
        );

        if (!vacancyData?.description) {
          throw new Error(`Не удалось извлечь описание вакансии ${vacancyId}`);
        }

        const updateResult = await updateVacancyDescription(
          vacancyId,
          vacancyData.description,
          vacancyData.workLocation,
          vacancyData.region,
        );

        if (!updateResult.success) {
          throw new Error(updateResult.error);
        }

        console.log(`✅ Вакансия ${vacancyId} успешно обновлена`);
        return { success: true, vacancyId };
      } finally {
        await closeBrowserSafely(browser);
      }
    });
  },
);
