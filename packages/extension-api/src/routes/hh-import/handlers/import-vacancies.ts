import { WorkspaceRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { saveBasicVacancy } from "@qbs-autonaim/jobs/services/vacancy";
import type { VacancyData } from "@qbs-autonaim/jobs-parsers";
import type { Context } from "hono";
import { vacanciesBodySchema } from "../schemas";

export async function handleImportVacancies(c: Context) {
  const userId = c.get("userId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Некорректный JSON" }, 400);
  }

  const parsed = vacanciesBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Требуется workspaceId и массив vacancies" }, 400);
  }
  const data = parsed.data;

  const workspaceRepository = new WorkspaceRepository(db);
  const member = await workspaceRepository.checkAccess(
    data.workspaceId,
    userId,
  );
  if (!member) {
    return c.json({ error: "Нет доступа к workspace" }, 403);
  }

  let imported = 0;
  let updated = 0;
  const savedExternalIds: string[] = [];

  for (const v of data.vacancies) {
    const vacancyData: VacancyData = {
      id: v.externalId,
      externalId: v.externalId,
      source: "hh",
      title: v.title,
      url: v.url,
      responsesUrl: null,
      resumesInProgress: "0",
      suitableResumes: "0",
      region: v.region,
      description: "",
      isActive: v.isActive ?? true,
    };

    const result = await saveBasicVacancy(vacancyData, data.workspaceId);
    if (result.success && result.data) {
      if (result.data.isNew) imported++;
      else updated++;
      savedExternalIds.push(v.externalId);
    }
  }

  return c.json({ imported, updated, savedExternalIds });
}
