import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { ShortlistGenerator } from "../../../services";
import { createErrorHandler } from "../../../utils/error-handler";

const getShortlistInputSchema = z.object({
  vacancyId: z.uuid(),
  workspaceId: workspaceIdSchema,
  minScore: z.number().int().min(0).max(100).optional().default(60),
  maxCandidates: z.number().int().min(1).max(100).optional().default(10),
  sortBy: z
    .enum(["SCORE", "EXPERIENCE", "RESPONSE_DATE"])
    .optional()
    .default("SCORE"),
});

export const getShortlist = protectedProcedure
  .input(getShortlistInputSchema)
  .handler(async ({ input, context }) => {
    const errorHandler = createErrorHandler(
      context.auditLogger,
      context.session.user.id,
      context.ipAddress,
      context.userAgent,
    );

    try {
      // Проверяем доступ к workspace
      const hasAccess = await context.workspaceRepository.checkAccess(
        input.workspaceId,
        context.session.user.id,
      );

      if (!hasAccess) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: context.session.user.id,
        });
      }

      // Проверяем существование вакансии и принадлежность к workspace
      const vacancy = await context.db.query.vacancy.findFirst({
        where: (vacancy, { eq, and }) =>
          and(
            eq(vacancy.id, input.vacancyId),
            eq(vacancy.workspaceId, input.workspaceId),
          ),
      });

      if (!vacancy) {
        throw await errorHandler.handleNotFoundError("Вакансия", {
          vacancyId: input.vacancyId,
          workspaceId: input.workspaceId,
        });
      }

      // Генерируем шортлист
      const generator = new ShortlistGenerator();
      const shortlist = await generator.generateShortlist(input.vacancyId, {
        minScore: input.minScore,
        maxCandidates: input.maxCandidates,
        sortBy: input.sortBy,
      });

      // Логируем доступ к персональным данным фрилансеров
      for (const candidate of shortlist.candidates) {
        await context.auditLogger.logResponseView({
          userId: context.session.user.id,
          responseId: candidate.responseId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
      }

      return shortlist;
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        vacancyId: input.vacancyId,
        operation: "get_shortlist",
      });
    }
  });
