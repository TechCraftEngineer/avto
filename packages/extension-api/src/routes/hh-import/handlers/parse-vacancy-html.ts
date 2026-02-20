import { eq, WorkspaceRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy as vacancySchema } from "@qbs-autonaim/db/schema";
import { extractVacancyDataFromHtml } from "@qbs-autonaim/html-parsers";
import { updateVacancyDescription } from "@qbs-autonaim/jobs/services/vacancy";
import type { Context } from "hono";
import { parseVacancyHtmlSchema } from "../schemas";

export async function handleParseVacancyHtml(c: Context) {
  const userId = c.get("userId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Некорректный JSON" }, 400);
  }

  const parsed = parseVacancyHtmlSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error:
          "Требуется workspaceId, vacancyExternalId, vacancyUrl и htmlContent",
      },
      400,
    );
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

  const v = await db.query.vacancy.findFirst({
    where: eq(vacancySchema.externalId, data.vacancyExternalId),
    columns: { id: true, workspaceId: true },
  });
  if (!v || v.workspaceId !== data.workspaceId) {
    return c.json(
      { error: `Вакансия ${data.vacancyExternalId} не найдена` },
      404,
    );
  }

  const result = await extractVacancyDataFromHtml(
    data.htmlContent,
    data.vacancyUrl,
    {
      isArchived: data.isArchived,
      region: data.region,
    },
  );

  if (!result?.description?.trim()) {
    return c.json({ error: "Не удалось извлечь описание из HTML" }, 422);
  }

  const updateResult = await updateVacancyDescription(
    v.id,
    result.description,
    result.workLocation,
    result.region,
  );

  if (!updateResult.success) {
    return c.json({ error: "Ошибка сохранения описания" }, 500);
  }

  return c.json({ success: true });
}
