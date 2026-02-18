import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { vacancy } from "@qbs-autonaim/db/schema";
import { saveBasicResponse } from "@qbs-autonaim/jobs/services/response";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { verifyWorkspaceAccess } from "../../../utils/verify-workspace-access";
import { protectedProcedure } from "../../../trpc";

const responseSchema = z.object({
  resumeId: z.string().min(1),
  resumeUrl: z.string().url(),
  name: z.string(),
  respondedAt: z.string().optional(),
  status: z.string().optional(),
  coverLetter: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

/**
 * Парсит дату из формата HH ("12 дек 2024", "вчера" и т.д.)
 */
function parseHHDate(dateStr?: string): Date | undefined {
  if (!dateStr?.trim()) return undefined;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export const importResponsesFromHH = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string().min(1),
      vacancyId: z.string().optional(),
      vacancyExternalId: z.string().min(1),
      responses: z.array(responseSchema).min(1).max(100),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    let entityId = input.vacancyId;
    if (!entityId) {
      const v = await db.query.vacancy.findFirst({
        where: eq(vacancy.externalId, input.vacancyExternalId),
        columns: { id: true, workspaceId: true },
      });
      if (!v || v.workspaceId !== input.workspaceId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Вакансия ${input.vacancyExternalId} не найдена. Сначала импортируйте вакансии.`,
        });
      }
      entityId = v.id;
    }

    let imported = 0;

    for (const r of input.responses) {
      const respondedAt = parseHHDate(r.respondedAt);
      const result = await saveBasicResponse(
        entityId,
        r.resumeId,
        r.resumeUrl,
        r.name,
        respondedAt,
      );
      if (result.success && result.data) {
        imported++;
      }
    }

    return { imported };
  });
