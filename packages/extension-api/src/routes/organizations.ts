import { OrganizationRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { Hono } from "hono";

export const organizationsRouter = new Hono<{
  Variables: { userId: string };
}>();

organizationsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const orgRepo = new OrganizationRepository(db);

  try {
    const organizations = await orgRepo.getUserOrganizations(userId);
    return c.json(organizations.map((o) => ({ id: o.id, name: o.name })));
  } catch (error) {
    console.error("[extension-api] organizations error:", error);
    return c.json({ error: "Внутренняя ошибка сервера" }, 500);
  }
});
