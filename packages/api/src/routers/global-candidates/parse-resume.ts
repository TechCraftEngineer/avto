/**
 * Парсит PDF/DOCX резюме с помощью Docling + LLM.
 * Возвращает структурированные данные для предзаполнения формы добавления кандидата.
 */

import { ORPCError } from "@orpc/server";
import { getAIModel, langfuse } from "@qbs-autonaim/lib/ai";
import { z } from "zod";
import {
  protectedProcedure,
  workspaceAccessMiddleware,
  workspaceInputSchema,
} from "../../orpc";
import {
  ResumeParserError,
  ResumeParserService,
} from "../../services/resume-parser";

const parseResumeInputSchema = workspaceInputSchema.merge(
  z.object({
    /** Base64-encoded file content (without data URL prefix) */
    fileContent: z
      .string()
      .min(1, "fileContent обязателен")
      .max(28_000_000, "Файл слишком большой"),
    /** Original filename with extension */
    filename: z.string().min(1, "filename обязателен"),
  }),
);

export const parseResume = protectedProcedure
  .input(parseResumeInputSchema)
  .use(workspaceAccessMiddleware)
  .handler(async ({ input }) => {
    const resumeParser = new ResumeParserService({
      model: getAIModel(),
      langfuse,
      config: { aiTimeoutMs: 90_000 }, // 90 сек — для сложных PDF с OCR
    });

    const validation = resumeParser.validateFormat(input.filename);
    if (!validation.isValid) {
      throw new ORPCError("BAD_REQUEST", {
        message: validation.error ?? "Неподдерживаемый формат файла",
      });
    }

    try {
      const fileBuffer = Buffer.from(input.fileContent, "base64");
      const parsedResume = await resumeParser.parse({
        type: validation.fileType,
        content: fileBuffer,
        filename: input.filename,
      });
      return parsedResume;
    } catch (error) {
      if (error instanceof ResumeParserError) {
        throw new ORPCError("BAD_REQUEST", {
          message: error.userMessage,
          cause: error,
        });
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось распарсить резюме",
        cause: error,
      });
    }
  });
