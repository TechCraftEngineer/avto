import { eq, WorkspaceRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy as vacancySchema } from "@qbs-autonaim/db/schema";
import { saveBasicResponse } from "@qbs-autonaim/jobs/services/response";
import type { Context } from "hono";
import { responsesBodySchema } from "../schemas";
import { processPhotoUpload } from "../utils/photo";
import { processResumePdf } from "../utils/resume-pdf";
import { processResumeText } from "../utils/resume-text";

export async function handleImportResponses(c: Context) {
  const userId = c.get("userId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Некорректный JSON" }, 400);
  }

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

  const workspaceRepository = new WorkspaceRepository(db);
  const member = await workspaceRepository.checkAccess(
    data.workspaceId,
    userId,
  );
  if (!member) {
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

    const saveResult = await saveBasicResponse(
      entityId,
      r.resumeId,
      r.resumeUrl,
      r.name,
      respondedAt,
      {
        coverLetter: r.coverLetter ?? null,
      },
    );

    if (saveResult.success && saveResult.data) {
      imported++;
      const responseId = saveResult.data.id;

      if (r.photoUrl) {
        await processPhotoUpload(r.photoUrl, responseId, r.resumeId, r.name);
      }

      if (r.resumeTextHtml?.trim()) {
        await processResumeText(r.resumeTextHtml, responseId);
      }

      if (r.resumePdfBase64) {
        await processResumePdf(r.resumePdfBase64, responseId, r.resumeId);
      }
    }
  }

  return c.json({ imported });
}
