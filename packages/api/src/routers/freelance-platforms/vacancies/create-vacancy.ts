import { ORPCError } from "@orpc/server";
import { vacancy } from "@qbs-autonaim/db/schema";
import { InterviewLinkGenerator } from "@qbs-autonaim/shared/server";
import {
  vacancyRequirementsSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { createErrorHandler } from "../../../utils/error-handler";

const createVacancyInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  requirements: vacancyRequirementsSchema.optional(),
  platformSource: z.enum([
    "HH",
    "AVITO",
    "SUPERJOB",
    "HABR",
    "FL_RU",
    "FREELANCE_RU",
    "WEB_LINK",
  ]),
  platformUrl: z.url().optional(),
});

export const createVacancy = protectedProcedure
  .input(createVacancyInputSchema)
  .handler(async ({ input, context }) => {
    const errorHandler = createErrorHandler(
      context.auditLogger,
      context.session.user.id,
      context.ipAddress,
      context.userAgent,
    );

    try {
      // Проверка доступа к workspace
      const access = await context.workspaceRepository.checkAccess(
        input.workspaceId,
        context.session.user.id,
      );

      if (!access) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: context.session.user.id,
        });
      }

      // Создаём вакансию
      const [createdVacancy] = await context.db
        .insert(vacancy)
        .values({
          workspaceId: input.workspaceId,
          title: input.title,
          description: input.description,
          requirements: input.requirements || null,
          source: input.platformSource,
          url: input.platformUrl,
          createdBy: context.session.user.id,
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
      const interviewLink = await linkGenerator.getOrCreateInterviewLink(
        createdVacancy.id,
      );

      return {
        vacancy: createdVacancy,
        interviewLink: {
          url: interviewLink.url,
          token: interviewLink.token,
          isActive: interviewLink.isActive,
        },
      };
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        workspaceId: input.workspaceId,
        operation: "create_vacancy",
      });
    }
  });
