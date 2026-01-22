import { and, eq } from "@qbs-autonaim/db";
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
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
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
  if (status === "INTERVIEW") {
    return "INTERVIEW";
  }
  return "SCREENING_DONE";
};

export const getById = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      candidateId: uuidv7Schema,
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

    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.candidateId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    const vacancyData = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancy.id, response.entityId),
      columns: { id: true, title: true, workspaceId: true },
    });

    if (!vacancyData || vacancyData.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    // Query related data separately
    const screening = await ctx.db.query.responseScreening.findFirst({
      where: eq(responseScreeningTable.responseId, response.id),
    });

    // Find interview session for this response
    const interview = await ctx.db.query.interviewSession.findFirst({
      where: eq(interviewSessionTable.responseId, response.id),
    });

    let interviewScoring = null;
    let messageCount = 0;

    if (interview) {
      interviewScoring = await ctx.db.query.interviewScoring.findFirst({
        where: eq(interviewScoringTable.interviewSessionId, interview.id),
      });

      const messages = await ctx.db.query.interviewMessage.findMany({
        where: eq(interviewMessageTable.sessionId, interview.id),
        columns: { id: true },
      });
      messageCount = messages.length;
    }

    let photoFile = null;
    if (response.photoFileId) {
      photoFile = await ctx.db.query.file.findFirst({
        where: eq(fileTable.id, response.photoFileId),
      });
    }

    let resumePdfFile = null;
    if (response.resumePdfFileId) {
      resumePdfFile = await ctx.db.query.file.findFirst({
        where: eq(fileTable.id, response.resumePdfFileId),
      });
    }

    const stage = mapResponseToStage(
      response.status,
      response.hrSelectionStatus,
    );

    const resumeScore = screening?.detailedScore;
    const interviewScore =
      interviewScoring?.rating ??
      Math.round((interviewScoring?.score ?? 0) / 20);

    const matchScore =
      resumeScore !== undefined && interviewScore !== undefined
        ? Math.round((resumeScore + interviewScore) / 2)
        : (resumeScore ?? interviewScore ?? 0);

    const contacts = response.contacts as Record<string, string> | null;
    const contactPhone = response.phone;
    const email = contacts?.email || null;
    const github = contacts?.github || contacts?.gitHub || null;
    const telegram = response.telegramUsername || contacts?.telegram || null;

    const avatarFileId = photoFile?.id ?? null;

    let resumePdfUrl: string | null = null;
    if (resumePdfFile) {
      resumePdfUrl = await getDownloadUrl(resumePdfFile.key);
    }

    // Получаем информацию о глобальном кандидате, если он связан
    let globalCandidate = null;
    if (response.globalCandidateId) {
      globalCandidate = await ctx.db.query.candidate.findFirst({
        where: eq(candidateTable.id, response.globalCandidateId),
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
          resumeUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return {
      id: response.id,
      name: response.candidateName || "Без имени",
      position: vacancyData.title || "Неизвестная должность",
      avatarFileId: avatarFileId,
      initials:
        response.candidateName
          ?.split(" ")
          .filter((n: string) => n.length > 0)
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "??",
      experience: response.experience || "Не указан",
      location: globalCandidate?.location || "Не указано",
      matchScore,
      resumeScore,
      interviewScore,
      scoreAnalysis: interviewScoring?.analysis ?? undefined,
      screeningAnalysis: screening?.analysis ?? undefined,
      availability: "Не указано",
      salaryExpectation:
        response.salaryExpectationsAmount ||
        globalCandidate?.salaryExpectationsAmount ||
        "Не указано",
      stage,
      status: response.status,
      hrSelectionStatus: response.hrSelectionStatus,
      vacancyId: response.entityId,
      vacancyName: vacancyData.title || "Неизвестная вакансия",
      email: email || globalCandidate?.email || null,
      phone: contactPhone || globalCandidate?.phone || null,
      github: github,
      telegram: telegram || globalCandidate?.telegramUsername || null,
      resumePdfUrl,
      messageCount: messageCount,
      globalCandidateId: response.globalCandidateId,
      globalCandidate: globalCandidate
        ? {
            id: globalCandidate.id,
            fullName: globalCandidate.fullName,
            email: globalCandidate.email,
            phone: globalCandidate.phone,
            telegramUsername: globalCandidate.telegramUsername,
            location: globalCandidate.location,
            headline: globalCandidate.headline,
            skills: globalCandidate.skills,
            experienceYears: globalCandidate.experienceYears,
            salaryExpectationsAmount: globalCandidate.salaryExpectationsAmount,
            resumeUrl: globalCandidate.resumeUrl,
            createdAt: globalCandidate.createdAt,
            updatedAt: globalCandidate.updatedAt,
          }
        : null,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  });
