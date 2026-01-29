import { vacancy } from "@qbs-autonaim/db/schema";
import {
  sanitize,
  secureSchemas,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

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
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

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
    const [newVacancy] = await ctx.db
      .insert(vacancy)
      .values({
        workspaceId: input.workspaceId,
        title: input.title,
        description: fullDescription || null,
        source: "MANUAL",
        createdBy: ctx.session.user.id,
        isActive: true,
      })
      .returning();

    if (!newVacancy) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать вакансию",
      });
    }

    return newVacancy;
  });
