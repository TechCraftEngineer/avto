import { and, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const duplicate = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new ORPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    // Создаём копию задания (title ограничен 500 символами)
    const copySuffix = " (копия)";
    const maxTitleLength = 500 - copySuffix.length;
    const title =
      existingGig.title.length > maxTitleLength
        ? `${existingGig.title.slice(0, maxTitleLength)}${copySuffix}`
        : `${existingGig.title}${copySuffix}`;

    const [newGig] = await ctx.db
      .insert(gig)
      .values({
        workspaceId: input.workspaceId,
        title,
        description: existingGig.description,
        type: existingGig.type,
        budgetMin: existingGig.budgetMin,
        budgetMax: existingGig.budgetMax,
        deadline: null, // Сбрасываем дедлайн для копии
        estimatedDuration: existingGig.estimatedDuration,
        requirements: existingGig.requirements,
        customBotInstructions: existingGig.customBotInstructions,
        customScreeningPrompt: existingGig.customScreeningPrompt,
        customInterviewQuestions: existingGig.customInterviewQuestions,
        customOrganizationalQuestions:
          existingGig.customOrganizationalQuestions,
        customDomainId: existingGig.customDomainId,
        interviewScenarioId: existingGig.interviewScenarioId,
        // Сбрасываем счётчики
        responses: 0,
        newResponses: 0,
        views: 0,
        // Новое задание создаём как неактивное
        isActive: false,
      })
      .returning({ id: gig.id, title: gig.title, isActive: gig.isActive });

    if (!newGig) {
      throw new ORPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать копию задания",
      });
    }

    return {
      id: newGig.id,
      title: newGig.title,
      isActive: newGig.isActive,
    };
  });
