import { InterviewLinkGenerator } from "@qbs-autonaim/shared/server";
import { z } from "zod";
import { publicProcedure } from "../../../trpc";
import { createErrorHandler } from "../../../utils/error-handler";

const validateInterviewTokenInputSchema = z.object({
  token: z.string().min(1),
});

export const validateInterviewToken = publicProcedure
  .input(validateInterviewTokenInputSchema)
  .query(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      undefined,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Валидируем токен через сервис
      const linkGenerator = new InterviewLinkGenerator();
      const interviewLink = await linkGenerator.validateLink(input.token);

      if (!interviewLink) {
        throw await errorHandler.handleNotFoundError("Ссылка на интервью", {
          token: input.token,
        });
      }

      return {
        id: interviewLink.id,
        vacancyId: interviewLink.entityId,
        token: interviewLink.token,
        url: interviewLink.url,
        isActive: interviewLink.isActive,
        createdAt: interviewLink.createdAt,
        expiresAt: interviewLink.expiresAt,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleInternalError(error as Error, {
        token: input.token,
        operation: "validate_interview_token",
      });
    }
  });
