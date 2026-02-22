import { ORPCError } from "@orpc/server";
import { desc, eq } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import { getFileUrl } from "@qbs-autonaim/lib/s3";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const listTop = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().int().min(1).max(20).default(5),
    }),
  )
  .handler(async ({ context, input }) => {
    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    const allResponses = await context.db.query.response.findMany({
      orderBy: [desc(responseTable.createdAt)],
      where: eq(responseTable.entityType, "vacancy"),
      columns: {
        id: true,
        entityId: true,
        candidateName: true,
        createdAt: true,
        photoFileId: true,
      },
    });

    // Get all vacancy IDs to query separately
    const vacancyIds = [...new Set(allResponses.map((r) => r.entityId))];
    const vacancies = await context.db.query.vacancy.findMany({
      where: (vacancy, { inArray }) => inArray(vacancy.id, vacancyIds),
      columns: {
        id: true,
        title: true,
        workspaceId: true,
      },
    });

    const vacancyMap = new Map(vacancies.map((v) => [v.id, v]));

    // Get all screenings separately
    const responseIds = allResponses.map((r) => r.id);
    const screenings = await context.db.query.responseScreening.findMany({
      where: (screening, { inArray }) =>
        inArray(screening.responseId, responseIds),
      columns: {
        responseId: true,
        overallScore: true,
      },
    });

    const screeningMap = new Map(screenings.map((s) => [s.responseId, s]));

    // Получаем URLs для фото
    const photoFileIds = allResponses
      .map((r) => r.photoFileId)
      .filter((id): id is string => id !== null);

    const photoFiles =
      photoFileIds.length > 0
        ? await context.db.query.file.findMany({
            where: (file, { inArray }) => inArray(file.id, photoFileIds),
            columns: { id: true, key: true },
          })
        : [];

    const photoUrlMap = new Map(
      photoFiles.map((f) => [f.id, getFileUrl(f.key)]),
    );

    return allResponses
      .map((r) => {
        const vacancy = vacancyMap.get(r.entityId);
        const screening = screeningMap.get(r.id);
        return {
          ...r,
          vacancy: vacancy
            ? {
                id: vacancy.id,
                title: vacancy.title,
                workspaceId: vacancy.workspaceId,
              }
            : null,
          screening: screening
            ? {
                score: screening.overallScore,
                detailedScore: screening.overallScore,
              }
            : null,
          photoUrl: r.photoFileId
            ? photoUrlMap.get(r.photoFileId) || null
            : null,
        };
      })
      .filter(
        (r) =>
          r.vacancy?.workspaceId === input.workspaceId &&
          r.screening?.detailedScore != null,
      )
      .sort(
        (a, b) =>
          (b.screening?.detailedScore ?? 0) - (a.screening?.detailedScore ?? 0),
      )
      .slice(0, input.limit);
  });
