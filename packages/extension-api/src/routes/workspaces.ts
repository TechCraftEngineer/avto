import { OrganizationRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { Hono } from "hono";

export const workspacesRouter = new Hono<{
  Variables: { userId: string };
}>();

workspacesRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const organizationId = c.req.query("organizationId");

  if (!organizationId) {
    return c.json({ error: "Требуется organizationId" }, 400);
  }

  const orgRepo = new OrganizationRepository(db);

  try {
    const hasAccess = await orgRepo.checkAccess(organizationId, userId);
    if (!hasAccess) {
      return c.json({ error: "Нет доступа к организации" }, 403);
    }

    const workspaces = await orgRepo.getWorkspaces(organizationId);
    return c.json(
      workspaces.map((w) => ({ id: w.id, name: w.name, slug: w.slug })),
    );
  } catch (error) {
    console.error("[extension-api] workspaces error:", error);
    return c.json({ error: "Внутренняя ошибка сервера" }, 500);
  }
});
