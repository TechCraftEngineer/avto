import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { ShortlistGenerator } from "../../../services";
import { protectedProcedure } from "../../../trpc";
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
  .query(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверяем доступ к workspace
      const hasAccess = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id,
      );

      if (!hasAccess) {
        throw await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Проверяем существование вакансии и принадлежность к workspace
      const vacancy = await ctx.db.query.vacancy.findFirst({
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
        await ctx.auditLogger.logResponseView({
          userId: ctx.session.user.id,
          responseId: candidate.responseId,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
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