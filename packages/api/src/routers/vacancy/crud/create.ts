import { ORPCError } from "@orpc/server";
import { vacancy } from "@qbs-autonaim/db/schema";
import {
  sanitize,
  secureSchemas,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";

const createVacancySchema = z.object({
  workspaceId: workspaceIdSchema,
  title: z
    .string()
    .min(1)
    .max(500)
    .transform((val) => sanitize.stripHtml(val))
    .transform((val) => sanitize.sanitizeXss(val)),
  description: secureSchemas.safeText.optional(),
  requirements: secureSchemas.safeText.optional(),
  responsibilities: secureSchemas.safeText.optional(),
  conditions: secureSchemas.safeText.optional(),
});

export const create = protectedProcedure
  .input(createVacancySchema)
  .handler(async ({ input, context }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    // Формируем description из всех полей
    const fullDescription = [
      input.description,
      input.requirements ? `\n\nТребования:\n${input.requirements}` : "",
      input.responsibilities
        ? `\n\nОбязанности:\n${input.responsibilities}`
        : "",
      input.conditions ? `\n\nУсловия:\n${input.conditions}` : "",
    ]
      .filter(Boolean)
      .join("")
      .trimStart();

    // Создание вакансии
    const [newVacancy] = await context.db
      .insert(vacancy)
      .values({
        workspaceId: input.workspaceId,
        title: input.title,
        description: fullDescription || null,
        source: "MANUAL",
        createdBy: context.session.user.id,
        isActive: true,
      })
      .returning();

    if (!newVacancy) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось создать вакансию",
      });
    }
    return newVacancy;
  });
