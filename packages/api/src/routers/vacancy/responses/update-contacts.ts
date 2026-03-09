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

const updateContactsInputSchema = z
  .object({
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
  })
  .refine(
    (data) =>
      Boolean(
        (typeof data.phone === "string" && data.phone.trim() !== "") ||
          (typeof data.email === "string" && data.email.trim() !== "") ||
          (typeof data.telegramUsername === "string" &&
            data.telegramUsername.trim() !== ""),
      ),
    { message: "Укажите хотя бы один контакт: телефон, email или Telegram" },
  );

export const updateContacts = protectedProcedure
  .input(updateContactsInputSchema)
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
      where: and(
        eq(vacancyTable.id, response.entityId),
        eq(vacancyTable.workspaceId, input.workspaceId),
      ),
      columns: { id: true },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", {
        message: "Отклик не найден в рабочем пространстве",
      });
    }

    const toNull = (v: string | undefined) =>
      v == null || String(v).trim() === "" ? null : String(v).trim();

    const setValues: {
      updatedAt: Date;
      phone?: string | null;
      email?: string | null;
      telegramUsername?: string | null;
    } = { updatedAt: new Date() };
    if ("phone" in input) {
      const phoneRaw = toNull(input.phone);
      setValues.phone = phoneRaw ? normalizePhone(phoneRaw) : null;
    }
    if ("email" in input) {
      setValues.email = toNull(input.email);
    }
    if ("telegramUsername" in input) {
      setValues.telegramUsername =
        toNull(input.telegramUsername)?.replace(/^@/, "") ?? null;
    }

    const [updated] = await context.db
      .update(responseTable)
      .set(setValues)
      .where(eq(responseTable.id, input.responseId))
      .returning();

    if (!updated) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось обновить контакты",
      });
    }

    return updated;
  });
