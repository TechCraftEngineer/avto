import { vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

const createVacancyFromChatSchema = z.object({
  workspaceId: workspaceIdSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  conditions: z.string().optional(),
  bonuses: z.string().optional(),
  customBotInstructions: z.string().max(5000).optional(),
  customScreeningPrompt: z.string().max(5000).optional(),
  customInterviewQuestions: z.string().max(5000).optional(),
  customOrganizationalQuestions: z.string().max(5000).optional(),
});

export const createFromChat = protectedProcedure
  .input(createVacancyFromChatSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace (Requirement 12.2)
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

    // Формируем description из всех полей в структурированном формате
    const descriptionParts: string[] = [];

    if (input.description) {
      descriptionParts.push(`Описание вакансии\n—\n${input.description}`);
    }

    if (input.requirements) {
      if (descriptionParts.length > 0) descriptionParts.push("");
      descriptionParts.push(`Требования\n—\n${input.requirements}`);
    }

    if (input.responsibilities) {
      if (descriptionParts.length > 0) descriptionParts.push("");
      descriptionParts.push(`Обязанности\n—\n${input.responsibilities}`);
    }

    if (input.conditions) {
      if (descriptionParts.length > 0) descriptionParts.push("");
      descriptionParts.push(`Условия\n—\n${input.conditions}`);
    }

    if (input.bonuses) {
      if (descriptionParts.length > 0) descriptionParts.push("");
      descriptionParts.push(
        `Премии и другие мотивационные выплаты\n—\n${input.bonuses}`,
      );
    }

    const fullDescription = descriptionParts.join("\n") || null;

    // Создание вакансии (Requirement 6.2)
    const [newVacancy] = await ctx.db
      .insert(vacancy)
      .values({
        workspaceId: input.workspaceId,
        title: input.title,
        description: fullDescription || null,
        source: "MANUAL",
        createdBy: ctx.session.user.id,
        isActive: true,
        // Bot configuration fields (Requirements 5.1, 5.2, 5.3, 5.4)
        customBotInstructions: input.customBotInstructions || null,
        customScreeningPrompt: input.customScreeningPrompt || null,
        customInterviewQuestions: input.customInterviewQuestions || null,
        customOrganizationalQuestions:
          input.customOrganizationalQuestions || null,
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