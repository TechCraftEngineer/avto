import { eq, WorkspaceRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy as vacancySchema } from "@qbs-autonaim/db/schema";
import { saveBasicResponse } from "@qbs-autonaim/jobs/services/response";
import {
  saveBasicVacancy,
  updateVacancyDescription,
} from "@qbs-autonaim/jobs/services/vacancy";
import type { VacancyData } from "@qbs-autonaim/jobs-parsers";
import { extractVacancyDataFromHtml } from "@qbs-autonaim/jobs-parsers";
import { Hono } from "hono";
import { z } from "zod";

export const hhImportRouter = new Hono<{
  Variables: { userId: string };
}>();

async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const workspaceRepository = new WorkspaceRepository(db);
  const member = await workspaceRepository.checkAccess(workspaceId, userId);
  return member != null;
}

const vacancyItemSchema = z.object({
  externalId: z.string(),
  title: z.string(),
  url: z.string(),
  region: z.string().optional(),
  views: z.string().optional(),
  responses: z.string().optional(),
  isActive: z.boolean().optional(),
});

const vacanciesBodySchema = z.object({
  workspaceId: z.string(),
  vacancies: z.array(vacancyItemSchema).min(1),
});

const responseItemSchema = z.object({
  resumeId: z.string(),
  resumeUrl: z.string(),
  name: z.string(),
  respondedAt: z.string().optional(),
});

const responsesBodySchema = z.object({
  workspaceId: z.string(),
  vacancyId: z.string().optional(),
  vacancyExternalId: z.string(),
  responses: z.array(responseItemSchema).min(1),
});

const parseVacancyHtmlSchema = z.object({
  workspaceId: z.string(),
  vacancyExternalId: z.string(),
  vacancyUrl: z.string().url(),
  htmlContent: z.string(),
  isArchived: z.boolean().optional(),
  region: z.string().optional(),
});

hhImportRouter.post("/parse-vacancy-html", async (c) => {
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

  const hasAccess = await verifyWorkspaceAccess(data.workspaceId, userId);
  if (!hasAccess) {
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
});

hhImportRouter.post("/", async (c) => {
  const userId = c.get("userId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Некорректный JSON" }, 400);
  }

  const type = c.req.query("type"); // "vacancies" | "responses"

  if (type === "vacancies") {
    const parsed = vacanciesBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Требуется workspaceId и массив vacancies" }, 400);
    }
    const data = parsed.data;

    const hasAccess = await verifyWorkspaceAccess(data.workspaceId, userId);
    if (!hasAccess) {
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
        views: v.views ?? "0",
        responses: v.responses ?? "0",
        responsesUrl: null,
        newResponses: "0",
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

  if (type === "responses") {
    const parsed = responsesBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "Требуется workspaceId, vacancyExternalId и массив responses",
        },
        400,
      );
    }
    const data = parsed.data;

    const hasAccess = await verifyWorkspaceAccess(data.workspaceId, userId);
    if (!hasAccess) {
      return c.json({ error: "Нет доступа к workspace" }, 403);
    }

    let entityId = data.vacancyId;
    if (!entityId) {
      const v = await db.query.vacancy.findFirst({
        where: eq(vacancySchema.externalId, data.vacancyExternalId),
        columns: { id: true, workspaceId: true },
      });
      if (!v || v.workspaceId !== data.workspaceId) {
        return c.json(
          {
            error: `Вакансия ${data.vacancyExternalId} не найдена. Сначала импортируйте вакансии.`,
          },
          404,
        );
      }
      entityId = v.id;
    }

    let imported = 0;

    for (const r of data.responses) {
      let respondedAt: Date | undefined;
      if (r.respondedAt) {
        const d = new Date(r.respondedAt);
        if (!Number.isNaN(d.getTime())) respondedAt = d;
      }

      const result = await saveBasicResponse(
        entityId,
        r.resumeId,
        r.resumeUrl,
        r.name,
        respondedAt,
      );
      if (result.success && result.data) imported++;
    }

    return c.json({ imported });
  }

  return c.json({ error: "Укажите type=vacancies или type=responses" }, 400);
});
