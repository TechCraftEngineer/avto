import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { createErrorHandler } from "../../../utils/error-handler";

const retryAnalysisInputSchema = z.object({
  responseId: z.uuid(),
});

/**
 * Ручной повтор AI-анализа для неудачного отклика
 * Требование: 6.6, 14.2
 */
export const retryAnalysis = protectedProcedure
  .input(retryAnalysisInputSchema)
  .handler(async ({ input, context }) => {
    const errorHandler = createErrorHandler(
      context.auditLogger,
      context.session.user.id,
      context.ipAddress,
      context.userAgent,
    );

    try {
      // Проверка существования отклика
      const response = await context.db.query.response.findFirst({
        where: and(
          eq(responseTable.id, input.responseId),
          eq(responseTable.entityType, "vacancy"),
        ),
      });

      if (!response) {
        throw await errorHandler.handleNotFoundError("Отклик", {
          responseId: input.responseId,
        });
      }

      // Query vacancy separately to check workspace access
      const vacancy = await context.db.query.vacancy.findFirst({
        where: eq(vacancyTable.id, response.entityId),
        columns: { workspaceId: true },
      });

      if (!vacancy) {
        throw await errorHandler.handleNotFoundError("Вакансия", {
          vacancyId: response.entityId,
        });
      }

      // Проверка доступа к workspace вакансии
      const hasAccess = await context.workspaceRepository.checkAccess(
        vacancy.workspaceId,
        context.session.user.id,
      );

      if (!hasAccess) {
        throw await errorHandler.handleAuthorizationError("отклика", {
          responseId: input.responseId,
          workspaceId: vacancy.workspaceId,
          userId: context.session.user.id,
        });
      }

      // Запускаем повторный AI-анализ через Inngest
      await inngest.send({
        name: "freelance/response.analyze",
        data: {
          responseId: input.responseId,
        },
      });

      // Логируем действие
      await context.auditLogger.logAccess({
        userId: context.session.user.id,
        action: "UPDATE",
        resourceType: "VACANCY_RESPONSE",
        resourceId: input.responseId,
        metadata: {
          action: "RETRY_ANALYSIS",
          vacancyId: response.entityId,
          candidateName: response.candidateName,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });

      return {
        success: true,
        message: "AI-анализ запущен повторно",
        responseId: input.responseId,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleInternalError(error as Error, {
        responseId: input.responseId,
        operation: "retry_analysis",
      });
    }
  });
