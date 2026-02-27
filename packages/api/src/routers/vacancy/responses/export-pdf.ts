import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  interviewScoring as interviewScoringTable,
  responseScreening as responseScreeningTable,
  response as responseTable,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import slugify from "@sindresorhus/slugify";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";
import { convertHtmlToPdf } from "../../../utils/gotenberg";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";
import {
  buildCandidateExportHtml,
  type ExportResponseData,
} from "./export-candidate-html";
import { mapScreeningToOutput } from "./mappers/screening-mapper";

const exportSectionsSchema = z.array(z.string()).min(1).max(10);

export const exportPdf = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
      workspaceId: workspaceIdSchema,
      sections: exportSectionsSchema,
    }),
  )
  .handler(async ({ context, input }) => {
    await verifyWorkspaceAccess(
      context.workspaceRepository,
      input.workspaceId,
      context.session.user.id,
    );

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "vacancy"),
      ),
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

    const responseData = {
      ...response,
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

    const pdfBuffer = await convertHtmlToPdf({
      html,
      filename,
    });

    return {
      pdfBase64: pdfBuffer.toString("base64"),
      filename: `${filename}.pdf`,
    };
  });
