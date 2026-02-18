import { saveBasicVacancy } from "@qbs-autonaim/jobs/services/vacancy";
import type { VacancyData } from "@qbs-autonaim/jobs-parsers";
import { z } from "zod";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";
import { protectedProcedure } from "../../../trpc";

const vacancySchema = z.object({
  externalId: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  region: z.string().optional(),
  views: z.string().optional(),
  responses: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const importVacanciesFromHH = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string().min(1),
      vacancies: z.array(vacancySchema).min(1).max(500),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    let imported = 0;
    let updated = 0;

    for (const v of input.vacancies) {
      const vacancyData: VacancyData = {
        id: v.externalId,
        externalId: v.externalId,
        source: "hh",
        title: v.title,
        url: v.url,
        views: v.views ?? "0",
        responses: v.responses ?? "0",
        responsesUrl: null,
        newResponses: "0",
        resumesInProgress: "0",
        suitableResumes: "0",
        region: v.region,
        description: "",
        isActive: v.isActive ?? true,
      };

      const result = await saveBasicVacancy(vacancyData, input.workspaceId);
      if (result.success && result.data) {
        if (result.data.isNew) {
          imported++;
        } else {
          updated++;
        }
      }
    }

    return { imported, updated };
  });
