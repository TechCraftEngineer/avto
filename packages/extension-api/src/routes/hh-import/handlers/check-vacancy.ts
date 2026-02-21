import { eq, WorkspaceRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy as vacancySchema } from "@qbs-autonaim/db/schema";
import type { Context } from "hono";
import { z } from "zod";

const checkVacancyBodySchema = z.object({
  workspaceId: z.string(),
  vacancyExternalId: z.string(),
});

export async function handleCheckVacancy(c: Context) {
  const userId = c.get("userId");

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Некорректный JSON" }, 400);
  }

  const parsed = checkVacancyBodySchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: "Требуется workspaceId и vacancyExternalId" },
      400,
    );
  }
  const { workspaceId, vacancyExternalId } = parsed.data;

  const workspaceRepository = new WorkspaceRepository(db);
  const member = await workspaceRepository.checkAccess(workspaceId, userId);
  if (!member) {
    return c.json({ error: "Нет доступа к workspace" }, 403);
  }

  const v = await db.query.vacancy.findFirst({
    where: eq(vacancySchema.externalId, vacancyExternalId),
    columns: { id: true, workspaceId: true },
  });

  const exists = Boolean(v && v.workspaceId === workspaceId);

  return c.json({ exists });
}
