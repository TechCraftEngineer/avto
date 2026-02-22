/**
 * Upload Resume Procedure
 *
 * Загружает и парсит резюме кандидата в рамках сессии преквалификации.
 * Публичная процедура - не требует авторизации пользователя.
 */

import { ORPCError } from "@orpc/server";
import { getAIModel, langfuse } from "@qbs-autonaim/lib/ai";
import { z } from "zod";
import { publicProcedure } from "../../orpc";
import { SessionManager } from "../../services/prequalification";
import { PrequalificationError } from "../../services/prequalification/types";
import {
  ResumeParserError,
  ResumeParserService,
} from "../../services/resume-parser";

const uploadResumeInputSchema = z.object({
  sessionId: z.uuid("sessionId должен быть UUID"),
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  /** Base64-encoded file content */
  fileContent: z
    .string()
    .min(1, "fileContent обязателен")
    .max(28_000_000, "fileContent слишком велик"),
  /** Original filename with extension */
  filename: z.string().min(1, "filename обязателен"),
});

export const uploadResume = publicProcedure
  .input(uploadResumeInputSchema)
  .handler(async ({ context, input }) => {
    const sessionManager = new SessionManager(context.db);

    // Verify session exists and belongs to workspace
    const session = await sessionManager.getSession(
      input.sessionId,
      input.workspaceId,
    );

    if (!session) {
      throw new ORPCError("NOT_FOUND", { message: "Сессия не найдена" });
    }

    if (session.status !== "resume_pending") {
      throw new ORPCError("BAD_REQUEST", {
        message: `Загрузка резюме недоступна в статусе: ${session.status}`,
      });
    }

    // Initialize resume parser
    const resumeParser = new ResumeParserService({
      model: getAIModel(),
      langfuse,
    });

    // Validate file format
    const validation = resumeParser.validateFormat(input.filename);
    if (!validation.isValid) {
      throw new ORPCError("BAD_REQUEST", {
        message: validation.error ?? "Неподдерживаемый формат файла",
      });
    }

    try {
      // Decode base64 content
      const fileBuffer = Buffer.from(input.fileContent, "base64");

      // Тип файла гарантированно существует когда isValid === true
      // Parse resume
      const parsedResume = await resumeParser.parse({
        type: validation.fileType,
        content: fileBuffer,
        filename: input.filename,
      });

      // Save resume and advance session status
      const { session: updatedSession, newStatus } =
        await sessionManager.saveResumeAndAdvance(
          input.sessionId,
          input.workspaceId,
          parsedResume,
        );

      return {
        success: true,
        parsedResume,
        newStatus,
        sessionId: updatedSession.id,
      };
    } catch (error) {
      if (error instanceof ResumeParserError) {
        throw new ORPCError("BAD_REQUEST", {
          message: error.userMessage,
          cause: error,
        });
      }

      if (error instanceof PrequalificationError) {
        const codeMap: Record<
          string,
          "BAD_REQUEST" | "NOT_FOUND" | "FORBIDDEN"
        > = {
          SESSION_NOT_FOUND: "NOT_FOUND",
          INVALID_STATE_TRANSITION: "BAD_REQUEST",
          TENANT_MISMATCH: "FORBIDDEN",
        };

        throw new ORPCError(codeMap[error.code] ?? "INTERNAL_SERVER_ERROR", {
          message: error.userMessage,
          cause: error,
        });
      }

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Внутренняя ошибка сервера",
        cause: error,
      });
    }
  });
