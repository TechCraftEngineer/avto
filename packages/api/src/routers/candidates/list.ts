import { and, desc, eq, ilike, inArray, lt, or } from "@qbs-autonaim/db";
import {
  candidate as candidateTable,
  file as fileTable,
  interviewMessage as interviewMessageTable,
  interviewScoring as interviewScoringTable,
  interviewSession as interviewSessionTable,
  responseScreening as responseScreeningTable,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const mapResponseToStage = (
  status: string,
  hrSelectionStatus: string | null,
): string => {
  if (hrSelectionStatus === "ONBOARDING") {
    return "ONBOARDING";
  }
  if (hrSelectionStatus === "CONTRACT_SENT") {
    return "CONTRACT_SENT";
  }
  if (hrSelectionStatus === "SECURITY_PASSED") {
    return "SECURITY_PASSED";
  }
  if (hrSelectionStatus === "OFFER") {
    return "OFFER_SENT";
  }
  if (hrSelectionStatus === "INVITE" || hrSelectionStatus === "RECOMMENDED") {
    return "OFFER_SENT";
  }
  if (
    hrSelectionStatus === "REJECTED" ||
    hrSelectionStatus === "NOT_RECOMMENDED" ||
    status === "SKIPPED"
  ) {
    return "REJECTED";
  }
  if (status === "EVALUATED") {
    return "SCREENING_DONE";
  }
  return "INTERVIEW";
};

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string().optional(),
      limit: z.number().int().min(1).max(200).default(100),
      cursor: uuidv7Schema.optional(),
      search: z.string().optional(),
      stages: z
        .array(
          z.enum([
            "SCREENING_DONE",
            "INTERVIEW",
            "OFFER_SENT",
            "SECURITY_PASSED",
            "CONTRACT_SENT",
            "ONBOARDING",
            "REJECTED",
          ]),
        )
        .optional(),
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

    if (input.search) {
      const search = `%${input.search}%`;
      const matchingVacancyIds = vacancies
        .filter((v) =>
          v.title.toLowerCase().includes(input.search?.toLowerCase() ?? ""),
        )
        .map((v) => v.id);

      const searchConditions = [ilike(responseTable.candidateName, search)];

      if (matchingVacancyIds.length > 0) {
        searchConditions.push(
          inArray(responseTable.entityId, matchingVacancyIds),
        );
      }

      const searchCondition = or(...searchConditions);
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (input.stages && input.stages.length > 0) {
      const stageConditions = [];

      if (input.stages.includes("ONBOARDING")) {
        stageConditions.push(eq(responseTable.hrSelectionStatus, "ONBOARDING"));
      }

      if (input.stages.includes("OFFER_SENT")) {
        stageConditions.push(eq(responseTable.hrSelectionStatus, "OFFER"));
      }

      if (input.stages.includes("REJECTED")) {
        stageConditions.push(
          or(
            inArray(responseTable.hrSelectionStatus, [
              "REJECTED",
              "NOT_RECOMMENDED",
            ]),
            eq(responseTable.status, "SKIPPED"),
          ),
        );
      }

      if (input.stages.includes("SCREENING_DONE")) {
        stageConditions.push(eq(responseTable.status, "EVALUATED"));
      }

      if (input.stages.includes("INTERVIEW")) {
        stageConditions.push(eq(responseTable.status, "INTERVIEW"));
      }

      if (input.stages.includes("SECURITY_PASSED")) {
        stageConditions.push(
          eq(responseTable.hrSelectionStatus, "SECURITY_PASSED"),
        );
      }

      if (input.stages.includes("CONTRACT_SENT")) {
        stageConditions.push(
          eq(responseTable.hrSelectionStatus, "CONTRACT_SENT"),
        );
      }

      if (stageConditions.length > 0) {
        const stageCondition = or(...stageConditions);
        if (stageCondition) {
          conditions.push(stageCondition);
        }
      }
    }

    if (input.cursor) {
      conditions.push(lt(responseTable.id, input.cursor));
    }

    const totalCount = await ctx.db.query.response.findMany({
      where: and(...conditions),
      columns: { id: true },
    });

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

    const responseIds = responses.map((r) => r.id);

    const screenings = await ctx.db.query.responseScreening.findMany({
      where: inArray(responseScreeningTable.responseId, responseIds),
    });

    // Find interview sessions for vacancy responses
    const interviewSessions = await ctx.db.query.interviewSession.findMany({
      where: inArray(interviewSessionTable.responseId, responseIds),
    });

    const interviewSessionIds = interviewSessions.map((s) => s.id);
    const interviewScorings =
      interviewSessionIds.length > 0
        ? await ctx.db.query.interviewScoring.findMany({
            where: inArray(
              interviewScoringTable.interviewSessionId,
              interviewSessionIds,
            ),
          })
        : [];

    // Get message counts
    const messageCounts = new Map<string, number>();
    for (const session of interviewSessions) {
      const messages = await ctx.db.query.interviewMessage.findMany({
        where: eq(interviewMessageTable.sessionId, session.id),
        columns: { id: true },
      });
      if (session.responseId) {
        messageCounts.set(session.responseId, messages.length);
      }
    }

    // Get photo files
    const photoFileIds = responses
      .map((r) => r.photoFileId)
      .filter((id): id is string => id !== null);
    const photoFiles =
      photoFileIds.length > 0
        ? await ctx.db.query.file.findMany({
            where: inArray(fileTable.id, photoFileIds),
          })
        : [];

    // Получаем информацию о глобальных кандидатах для всех откликов
    const globalCandidateIds = responses
      .map((r) => r.globalCandidateId)
      .filter((id): id is string => id !== null);

    const globalCandidates =
      globalCandidateIds.length > 0
        ? await ctx.db.query.candidate.findMany({
            where: inArray(candidateTable.id, globalCandidateIds),
            columns: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              telegramUsername: true,
              location: true,
              headline: true,
              skills: true,
              experienceYears: true,
              salaryExpectationsAmount: true,
            },
          })
        : [];

    const globalCandidatesMap = new Map(globalCandidates.map((c) => [c.id, c]));

    const items = responses.map((r) => {
      const vacancyData = vacancies.find((v) => v.id === r.entityId);
      const stage = mapResponseToStage(r.status, r.hrSelectionStatus);

      const screening = screenings.find((s) => s.responseId === r.id);
      const interviewSession = interviewSessions.find(
        (s) => s.responseId === r.id,
      );
      const interviewScoring = interviewSession
        ? interviewScorings.find(
            (is) => is.interviewSessionId === interviewSession.id,
          )
        : null;

      const resumeScore = screening?.detailedScore;
      const interviewScore =
        interviewScoring?.rating ??
        Math.round((interviewScoring?.score ?? 0) / 20);

      const matchScore =
        resumeScore !== undefined && interviewScore !== undefined
          ? Math.round((resumeScore + interviewScore) / 2)
          : (resumeScore ?? interviewScore ?? 0);

      const contacts = r.contacts as Record<string, string> | null;
      const telegram = r.telegramUsername || contacts?.telegram || null;
      const email = contacts?.email || null;
      const photoFile = photoFiles.find((f) => f.id === r.photoFileId);
      const avatarFileId = photoFile?.id ?? null;
      const messageCount = r.id ? (messageCounts.get(r.id) ?? 0) : 0;

      // Получаем информацию о глобальном кандидате, если он связан
      const globalCandidate = r.globalCandidateId
        ? globalCandidatesMap.get(r.globalCandidateId)
        : null;

      return {
        id: r.id,
        name: r.candidateName || globalCandidate?.fullName || "Без имени",
        position: vacancyData?.title || "Неизвестная должность",
        avatarFileId: avatarFileId,
        initials:
          (r.candidateName || globalCandidate?.fullName)
            ?.split(" ")
            .filter((n: string) => n.length > 0)
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "??",
        experience: r.experience || "Не указан",
        location: globalCandidate?.location || "Не указано",
        matchScore,
        stage,
        status: r.status,
        hrSelectionStatus: r.hrSelectionStatus,
        vacancyId: r.entityId,
        vacancyName: vacancyData?.title || "Неизвестная вакансия",
        salaryExpectation:
          r.salaryExpectationsAmount ??
          globalCandidate?.salaryExpectationsAmount ??
          "Не указано",
        email: email || globalCandidate?.email || null,
        phone: r.phone || globalCandidate?.phone || null,
        telegram: telegram || globalCandidate?.telegramUsername || null,
        messageCount,
        globalCandidateId: r.globalCandidateId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return {
      items,
      nextCursor,
      total: totalCount.length,
    };
  });
