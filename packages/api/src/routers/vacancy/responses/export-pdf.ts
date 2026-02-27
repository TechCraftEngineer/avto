import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  interviewScoring as interviewScoringTable,
  responseScreening as responseScreeningTable,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { getFileBufferFromS3 } from "@qbs-autonaim/lib/s3";
import slugify from "@sindresorhus/slugify";
import { z } from "zod";
import {
  protectedProcedure,
  workspaceAccessMiddleware,
  workspaceInputSchema,
} from "../../../orpc";
import { convertHtmlToPdf } from "../../../utils/gotenberg";
import {
  buildCandidateExportHtml,
  type ExportResponseData,
  type ExportSectionId,
} from "./export-candidate-html";
import { mapScreeningToOutput } from "./mappers/screening-mapper";

const exportSectionIdEnum = z.enum([
  "personal",
  "contact",
  "experience",
  "skills",
  "portfolio",
  "assessment",
] as [ExportSectionId, ...ExportSectionId[]]);
const exportSectionsSchema = z.array(exportSectionIdEnum).min(1).max(10);

const exportPdfInputSchema = z.object({
  responseId: z.string().uuid(),
  sections: exportSectionsSchema,
});

export const exportPdf = protectedProcedure
  .input(workspaceInputSchema.merge(exportPdfInputSchema))
  .use(workspaceAccessMiddleware)
  .handler(async ({ context, input }) => {
    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
      with: {
        photoFile: { columns: { key: true, mimeType: true } },
      },
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", {
        message: "Отклик не найден",
      });
    }

    const vacancy = await context.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.entityId),
      columns: { workspaceId: true },
    });

    if (!vacancy) {
      throw new ORPCError("NOT_FOUND", { message: "Вакансия не найдена" });
    }

    if (vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому отклику",
      });
    }

    const screening = await context.db.query.responseScreening.findFirst({
      where: eq(responseScreeningTable.responseId, response.id),
    });

    const directInterviewScoring =
      await context.db.query.interviewScoring.findFirst({
        where: eq(interviewScoringTable.responseId, response.id),
      });

    let photoDataUrl: string | null = null;
    if (response.photoFile?.key) {
      try {
        const { buffer, contentType } = await getFileBufferFromS3(
          response.photoFile.key,
        );
        const mime = contentType?.startsWith("image/")
          ? contentType
          : "image/jpeg";
        photoDataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
      } catch {
        // Фото недоступно — продолжаем без него
      }
    }

    const responseData = {
      ...response,
      photoDataUrl,
      screening: screening ? mapScreeningToOutput(screening) : null,
      interviewScoring: directInterviewScoring
        ? {
            score:
              directInterviewScoring.rating ??
              Math.round(directInterviewScoring.score / 20),
            analysis: directInterviewScoring.analysis ?? null,
          }
        : null,
    };

    const html = buildCandidateExportHtml(
      responseData as ExportResponseData,
      input.sections,
    );

    const rawName =
      response.candidateName?.replace(/[/\\:*?"<>|]/g, "_") || "candidate";
    const filename =
      slugify(`${rawName}_profile`, { lowercase: false }) ||
      "candidate_profile";

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await convertHtmlToPdf({
        html,
        filename,
      });
    } catch (err) {
      console.error("[exportPdf] convertHtmlToPdf error:", err);
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          "Не удалось сформировать PDF. Сервис конвертации временно недоступен.",
      });
    }

    return {
      pdfBase64: pdfBuffer.toString("base64"),
      filename: `${filename}.pdf`,
    };
  });
