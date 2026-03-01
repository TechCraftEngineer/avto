import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { generateWelcomeMessage } from "@qbs-autonaim/jobs/services/messaging";
import { InterviewLinkGenerator } from "@qbs-autonaim/shared/server";
import { z } from "zod";
import {
  protectedProcedure,
  workspaceAccessMiddleware,
  workspaceInputSchema,
} from "../../../orpc";

const generateWelcomeMessageInputSchema = workspaceInputSchema.merge(
  z.object({ responseId: z.string().uuid() }),
);

export const generateWelcomeMessageProcedure = protectedProcedure
  .input(generateWelcomeMessageInputSchema)
  .use(workspaceAccessMiddleware)
  .handler(async ({ context, input }) => {
    const { responseId, workspaceId } = input;

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    if (vacancy.workspaceId !== workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.getOrCreateResponseInterviewLink(
      responseId,
      vacancy.workspaceId,
    );

    const result = await generateWelcomeMessage(
      responseId,
      "hh-webchat-invite",
      interviewLink.url,
    );

    if (!result.success) {
      console.error("[generateWelcomeMessage] AI service error:", result.error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          "Не удалось сгенерировать приглашение на интервью. Попробуйте позже.",
      });
    }

    const rawMessage = result.data;
    const MAX_WELCOME_LENGTH = 5000;
    const trimmed = typeof rawMessage === "string" ? rawMessage.trim() : "";

    if (!trimmed) {
      console.error(
        "[generateWelcomeMessage] AI returned empty or invalid message",
      );
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          "Не удалось сгенерировать приглашение на интервью. Попробуйте позже.",
      });
    }

    const safeMessage =
      trimmed.length > MAX_WELCOME_LENGTH
        ? `${trimmed.slice(0, MAX_WELCOME_LENGTH)}...`
        : trimmed;

    return { message: safeMessage };
  });
