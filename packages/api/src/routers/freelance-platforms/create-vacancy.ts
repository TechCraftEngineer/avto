import { vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { InterviewLinkGenerator } from "../../services";
import { protectedProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";

const createVacancyInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  requirements: z.string().optional(),
  platformSource: z.enum([
    "HH",
    "AVITO",
    "SUPERJOB",
    "HABR",
    "KWORK",
    "FL_RU",
    "FREELANCE_RU",
    "WEB_LINK",
  ]),
  platformUrl: z.url().optional(),
});

export const createVacancy = protectedProcedure
  .input(createVacancyInputSchema)
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверка доступа к workspace
      const access = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id,
      );

      if (!access) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Создаём вакансию
      const [createdVacancy] = await ctx.db
        .insert(vacancy)
        .values({
          workspaceId: input.workspaceId,
          title: input.title,
          description: input.description,
          source: input.platformSource,
          url: input.platformUrl,
          isActive: true,
        })
        .returning();

      if (!createdVacancy) {
        throw await errorHandler.handleInternalError(
          new Error("Failed to create vacancy"),
          {
            workspaceId: input.workspaceId,
            title: input.title,
          },
        );
      }

      // Генерируем ссылку на интервью
      const linkGenerator = new InterviewLinkGenerator();
      const interviewLink = await linkGenerator.getOrCreateInterviewLink(createdVacancy.id);

      return {
        vacancy: createdVacancy,
        interviewLink: {
          url: interviewLink.url,
          token: interviewLink.token,
          isActive: interviewLink.isActive,
        },
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        workspaceId: input.workspaceId,
        operation: "create_vacancy",
      });
    }
  });
