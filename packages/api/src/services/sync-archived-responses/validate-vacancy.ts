/**
 * Валидация вакансии и публикации перед синхронизацией
 */

import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
// biome-ignore lint/style/useImportType: vacancyPublication нужен для typeof в ValidatedVacancy
import { vacancy, vacancyPublication } from "@qbs-autonaim/db/schema";

export interface ValidatedVacancy {
  vacancy: typeof vacancy.$inferSelect;
  publication: typeof vacancyPublication.$inferSelect;
}

/**
 * Валидирует вакансию и её публикацию на HH.ru
 * @throws Error если вакансия не найдена, не принадлежит workspace или нет публикации
 */
export async function validateVacancy(
  vacancyId: string,
  workspaceId: string,
): Promise<ValidatedVacancy> {
  const vacancyData = await db.query.vacancy.findFirst({
    where: eq(vacancy.id, vacancyId),
  });

  if (!vacancyData) {
    throw new Error(`Вакансия ${vacancyId} не найдена`);
  }

  if (vacancyData.workspaceId !== workspaceId) {
    throw new Error(
      `Вакансия ${vacancyId} не принадлежит рабочему пространству ${workspaceId}`,
    );
  }

  const publication = await db.query.vacancyPublication.findFirst({
    where: (pub, { and, eq }) =>
      and(eq(pub.vacancyId, vacancyId), eq(pub.platform, "HH")),
  });

  if (!publication) {
    throw new Error("Вакансия не опубликована на HH.ru");
  }

  if (!publication.externalId && !publication.url) {
    throw new Error("У публикации нет externalId или URL для синхронизации");
  }

  return { vacancy: vacancyData, publication };
}
