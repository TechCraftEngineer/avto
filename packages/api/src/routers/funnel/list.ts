import { and, desc, eq, inArray, lt } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { formatExperienceText } from "@qbs-autonaim/shared";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { mapResponseToStage } from "./map-response-stage";

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: uuidv7Schema.optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const vacancies = await ctx.db.query.vacancy.findMany({
      where: eq(vacancy.workspaceId, input.workspaceId),
      columns: { id: true, title: true },
    });

    const vacancyIds = vacancies.map((v) => v.id);

    if (vacancyIds.length === 0) {
      return {
        items: [],
        nextCursor: undefined,
      };
    }

    const conditions = [
      eq(responseTable.entityType, "vacancy"),
      inArray(responseTable.entityId, vacancyIds),
    ];

    if (input.vacancyId) {
      conditions.push(eq(responseTable.entityId, input.vacancyId));
    }

    if (input.cursor) {
      conditions.push(lt(responseTable.id, input.cursor));
    }

    const responses = await ctx.db.query.response.findMany({
      where: and(...conditions),
      orderBy: [desc(responseTable.id)],
      limit: input.limit + 1,
    });

    let nextCursor: string | undefined;
    if (responses.length > input.limit) {
      const nextItem = responses.pop();
      nextCursor = nextItem?.id;
    }

    // Query related data separately
    const responseIds = responses.map((r) => r.id);

    const screenings =
      responseIds.length > 0
        ? await ctx.db.query.responseScreening.findMany({
            where: (s, { inArray }) => inArray(s.responseId, responseIds),
          })
        : [];

    const interviewScorings =
      responseIds.length > 0
        ? await ctx.db.query.interviewScoring.findMany({
            where: (is, { inArray }) => inArray(is.responseId, responseIds),
          })
        : [];

    const items = responses.map((r) => {
      const vacancyData = vacancies.find((v) => v.id === r.entityId);
      const screening = screenings.find((s) => s.responseId === r.id);
      const interviewScoring = interviewScorings.find(
        (is) => is.responseId === r.id,
      );
      const stage = mapResponseToStage(r.status, r.hrSelectionStatus);

      return {
        id: r.id,
        name: r.candidateName || "Без имени",
        position: vacancyData?.title || "Неизвестная должность",
        avatar: null,
        avatarFileId: r.photoFileId ?? null,
        initials:
          r.candidateName
            ?.split(" ")
            .filter((n) => n.length > 0)
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "??",
        experience: formatExperienceText(r.profileData) || "Не указан",
        location: "Не указано",
        skills: [],
        matchScore: screening?.overallScore || 0,
        resumeScore: screening?.overallScore,
        interviewScore:
          interviewScoring?.rating ??
          Math.round((interviewScoring?.score ?? 0) / 20),
        scoreAnalysis: interviewScoring?.analysis ?? undefined,
        availability: "Не указано",
        salaryExpectation: "Не указано",
        stage,
        status: r.status,
        hrSelectionStatus: r.hrSelectionStatus,
        vacancyId: r.entityId,
        vacancyName: vacancyData?.title || "Неизвестная вакансия",
        email: null,
        phone: r.phone,
        telegram: r.telegramUsername,
        github: null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return {
      items,
      nextCursor,
    };
  });
