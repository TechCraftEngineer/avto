import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  file as fileTable,
  globalCandidate,
  interviewMessage as interviewMessageTable,
  interviewScoring as interviewScoringTable,
  interviewSession as interviewSessionTable,
  responseScreening as responseScreeningTable,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { getDownloadUrl } from "@qbs-autonaim/lib/s3";
import { formatExperienceText } from "@qbs-autonaim/shared";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

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
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    const response = await context.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.candidateId),
        eq(responseTable.entityType, "vacancy"),
      ),
    });

    if (!response) {
      throw new ORPCError("NOT_FOUND", { message: "Кандидат не найден", });
    }

    const vacancyData = await context.db.query.vacancy.findFirst({
      where: eq(vacancy.id, response.entityId),
      columns: { id: true, title: true, workspaceId: true },
    });

    if (!vacancyData || vacancyData.workspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к этому кандидату", });
    }

    // Query related data separately
    const screening = await context.db.query.responseScreening.findFirst({
      where: eq(responseScreeningTable.responseId, response.id),
    });

    // Find interview session for this response
    const interview = await context.db.query.interviewSession.findFirst({
      where: eq(interviewSessionTable.responseId, response.id),
    });

    let interviewScoring = null;
    let messageCount = 0;

    if (interview) {
      interviewScoring = await context.db.query.interviewScoring.findFirst({
        where: eq(interviewScoringTable.interviewSessionId, interview.id),
      });

      const messages = await context.db.query.interviewMessage.findMany({
        where: eq(interviewMessageTable.sessionId, interview.id),
        columns: { id: true },
      });
      messageCount = messages.length;
    }

    let photoFile = null;
    if (response.photoFileId) {
      photoFile = await context.db.query.file.findFirst({
        where: eq(fileTable.id, response.photoFileId),
      });
    }

    let resumePdfFile = null;
    if (response.resumePdfFileId) {
      resumePdfFile = await context.db.query.file.findFirst({
        where: eq(fileTable.id, response.resumePdfFileId),
      });
    }

    const stage = mapResponseToStage(
      response.status,
      response.hrSelectionStatus,
    );

    const resumeScore = screening?.overallScore;
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
    let globalCandidateData = null;
    if (response.globalCandidateId) {
      globalCandidateData = await context.db.query.globalCandidate.findFirst({
        where: eq(globalCandidate.id, response.globalCandidateId),
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
      experience: formatExperienceText(response.profileData) || "Не указан", // Из profileData
      location: globalCandidateData?.location || "Не указано",
      matchScore,
      resumeScore,
      interviewScore,
      scoreAnalysis: interviewScoring?.analysis ?? undefined,
      screeningAnalysis: screening?.overallAnalysis ?? undefined,
      availability: "Не указано",
      salaryExpectation:
        response.salaryExpectationsAmount ||
        globalCandidateData?.salaryExpectationsAmount ||
        "Не указано",
      stage,
      status: response.status,
      hrSelectionStatus: response.hrSelectionStatus,
      vacancyId: response.entityId,
      vacancyName: vacancyData.title || "Неизвестная вакансия",
      email: email || globalCandidateData?.email || null,
      phone: contactPhone || globalCandidateData?.phone || null,
      github: github,
      telegram: telegram || globalCandidateData?.telegramUsername || null,
      resumePdfUrl,
      messageCount: messageCount,
      globalCandidateId: response.globalCandidateId,
      globalCandidate: globalCandidateData
        ? {
            id: globalCandidateData.id,
            fullName: globalCandidateData.fullName,
            email: globalCandidateData.email,
            phone: globalCandidateData.phone,
            telegramUsername: globalCandidateData.telegramUsername,
            location: globalCandidateData.location,
            headline: globalCandidateData.headline,
            skills: globalCandidateData.skills,
            experienceYears: globalCandidateData.experienceYears,
            salaryExpectationsAmount:
              globalCandidateData.salaryExpectationsAmount,
            resumeUrl: globalCandidateData.resumeUrl,
            createdAt: globalCandidateData.createdAt,
            updatedAt: globalCandidateData.updatedAt,
          }
        : null,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  });
