import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
import { vacancy, vacancyPublication } from "@qbs-autonaim/db/schema";
import { z } from "zod";

import type { VacancyMapping } from "../types";

interface InsertedVacancy {
  id: string;
  title: string;
}

/**
 * Demo-only platform restriction
 *
 * VALID_PLATFORMS is intentionally limited to a subset of platformSourceEnum values
 * for demo data purposes. The full enum includes: MANUAL, HH, AVITO, SUPERJOB, HABR,
 * HH, AVITO, SUPERJOB, HABR, FL_RU, FREELANCE_RU, WEB_LINK, TELEGRAM.
 *
 * Demo data only includes vacancies from these three platforms to keep the dataset
 * focused and manageable for testing/demonstration purposes.
 */
const ValidPlatformSchema = z.enum(["HH", "SUPERJOB", "MANUAL"]);

export async function loadVacancies(recruiterId: string): Promise<{
  insertedVacancies: InsertedVacancy[];
  vacancyMapping: VacancyMapping;
}> {
  console.log("\n📝 Загружаем вакансии...");

  const vacanciesPath = join(__dirname, "../../data/vacancies.json");
  const vacanciesData = JSON.parse(readFileSync(vacanciesPath, "utf-8"));

  console.log(`📋 Найдено ${vacanciesData.length} вакансий`);

  // Добавляем createdBy для всех вакансий
  const vacanciesWithCreator = vacanciesData.map((v: any) => ({
    ...v,
    createdBy: recruiterId,
  }));

  const insertedVacancies = await db
    .insert(vacancy)
    .values(vacanciesWithCreator)
    .returning({ id: vacancy.id, title: vacancy.title });

  if (insertedVacancies.length > 0) {
    const publications = insertedVacancies
      .map((v, index) => {
        const sourceData = vacanciesData[index];

        const platformResult = ValidPlatformSchema.safeParse(sourceData.source);

        if (!platformResult.success) {
          console.warn(
            `⚠️  Пропущена публикация для вакансии "${v.title}": недопустимое значение platform "${sourceData.source}". Допустимые значения для демо: ${ValidPlatformSchema.options.join(", ")}`,
          );
          return null;
        }

        return {
          vacancyId: v.id,
          platform: platformResult.data,
          externalId: sourceData.externalId,
          url: sourceData.url,
          isActive: true,
        };
      })
      .filter((pub): pub is NonNullable<typeof pub> => pub !== null);

    if (publications.length > 0) {
      await db.insert(vacancyPublication).values(publications).returning({
        id: vacancyPublication.id,
        vacancyId: vacancyPublication.vacancyId,
      });
      console.log(`🔗 Создано ${publications.length} публикаций для вакансий`);
    }
  }

  console.log("✅ Вакансии загружены:");
  for (const v of insertedVacancies) {
    console.log(`  - ${v.title} (ID: ${v.id})`);
  }

  // Создаем маппинг для демо данных вакансий
  const vacancyMapping: VacancyMapping = {};
  if (insertedVacancies.length >= 3) {
    vacancyMapping["01234567-89ab-cdef-0123-456789abcdef"] =
      insertedVacancies[0]?.id || "";
    vacancyMapping["fedcba98-7654-3210-fedc-ba9876543210"] =
      insertedVacancies[1]?.id || "";
    vacancyMapping["abcdef01-2345-6789-abcd-ef0123456789"] =
      insertedVacancies[2]?.id || "";
    vacancyMapping["11111111-2222-3333-4444-555555555555"] =
      insertedVacancies[3]?.id || "";
    vacancyMapping["22222222-3333-4444-5555-666666666666"] =
      insertedVacancies[4]?.id || "";
    vacancyMapping["33333333-4444-5555-6666-777777777777"] =
      insertedVacancies[5]?.id || "";
    vacancyMapping["44444444-5555-6666-7777-888888888888"] =
      insertedVacancies[6]?.id || "";
    vacancyMapping["55555555-6666-7777-8888-999999999999"] =
      insertedVacancies[7]?.id || "";
    vacancyMapping["66666666-7777-8888-9999-aaaaaaaaaaaa"] =
      insertedVacancies[8]?.id || "";
    vacancyMapping["77777777-8888-9999-aaaa-bbbbbbbbbbbb"] =
      insertedVacancies[9]?.id || "";
  }

  return { insertedVacancies, vacancyMapping };
}
