import { and, eq, WorkspaceRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response, vacancy } from "@qbs-autonaim/db/schema";
import type { Context } from "hono";
import { z } from "zod";
import { processResumePdf } from "../utils/resume-pdf";

const uploadResumePdfSchema = z.object({
  workspaceId: z.string().uuid(),
  vacancyExternalId: z.string(),
  resumeId: z.string(),
  resumePdfBase64: z.string().regex(/^data:application\/pdf;base64,/, {
    message:
      "resumePdfBase64 должен быть в формате data:application/pdf;base64,...",
  }),
});

export async function handleUploadResumePdf(c: Context) {
  const userId = c.get("userId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Некорректный JSON" }, 400);
  }

  const parsed = uploadResumePdfSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      {
        error:
          "Неверные параметры: workspaceId, vacancyExternalId, resumeId, resumePdfBase64",
      },
      400,
    );
  }

  const { workspaceId, vacancyExternalId, resumeId, resumePdfBase64 } =
    parsed.data;

  const workspaceRepository = new WorkspaceRepository(db);
  const member = await workspaceRepository.checkAccess(workspaceId, userId);
  if (!member) {
    return c.json({ error: "Нет доступа к workspace" }, 403);
  }

  const v = await db.query.vacancy.findFirst({
    where: and(
      eq(vacancy.externalId, vacancyExternalId),
      eq(vacancy.workspaceId, workspaceId),
    ),
    columns: { id: true },
  });

  if (!v) {
    return c.json({ error: "Вакансия не найдена" }, 404);
  }

  const existingResponse = await db.query.response.findFirst({
    where: and(
      eq(response.entityType, "vacancy"),
      eq(response.entityId, v.id),
      eq(response.candidateId, resumeId),
    ),
    columns: { id: true },
  });

  if (!existingResponse) {
    return c.json(
      { error: "Отклик не найден. Сначала импортируйте отклики." },
      404,
    );
  }

  await processResumePdf(resumePdfBase64, existingResponse.id, resumeId);

  return c.json({ success: true });
}
