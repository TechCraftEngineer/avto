import { desc, eq, WorkspaceRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import { Hono } from "hono";

export const vacanciesRouter = new Hono<{
  Variables: { userId: string };
}>();

vacanciesRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const workspaceId = c.req.query("workspaceId");

  if (!workspaceId) {
    return c.json({ error: "Требуется workspaceId" }, 400);
  }

  const workspaceRepo = new WorkspaceRepository(db);

  try {
    const hasAccess = await workspaceRepo.checkAccess(workspaceId, userId);
    if (!hasAccess) {
      return c.json({ error: "Нет доступа к рабочему пространству" }, 403);
    }

    const vacancies = await db.query.vacancy.findMany({
      where: eq(vacancy.workspaceId, workspaceId),
      columns: { id: true, title: true, isFavorite: true, isActive: true },
      orderBy: [desc(vacancy.isFavorite), desc(vacancy.isActive)],
    });

    return c.json(vacancies);
  } catch (error) {
    console.error("[extension-api] vacancies error:", error);
    return c.json({ error: "Внутренняя ошибка сервера" }, 500);
  }
});
