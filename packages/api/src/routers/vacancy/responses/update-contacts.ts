import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { normalizePhone, workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

export const updateContacts = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
      workspaceId: workspaceIdSchema,
      phone: z.string().max(50).optional(),
      email: z
        .string()
        .max(255)
        .optional()
        .refine(
          (v) => !v || v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
          "Некорректный email",
        ),
      telegramUsername: z.string().max(100).optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    if (vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    const toNull = (v: string | undefined) =>
      v == null || String(v).trim() === "" ? null : String(v).trim();

    const phoneRaw = toNull(input.phone);
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
    const email = toNull(input.email);
    const telegramUsername =
      toNull(input.telegramUsername)?.replace(/^@/, "") ?? null;

    const [updated] = await context.db
      .update(responseTable)
      .set({
        phone,
        email,
        telegramUsername,
        updatedAt: new Date(),
      })
      .where(eq(responseTable.id, input.responseId))
      .returning();

    if (!updated) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось обновить контакты",
      });
    }

    return updated;
  });
