import { response as responseTable } from "@qbs-autonaim/db/schema";
import type { Database } from "../../../../types/database";
import type { ErrorHandler } from "../../../../utils/error-handler";
import type { FreelancerInfo } from "../types";
import { normalizeProfileUrl } from "./normalize-profile-url";

export async function createVacancyResponse(
  db: Database,
  vacancyId: string,
  freelancerInfo: FreelancerInfo,
  errorHandler: ErrorHandler,
) {
  const normalizedProfileUrl = freelancerInfo.platformProfileUrl
    ? normalizeProfileUrl(freelancerInfo.platformProfileUrl)
    : `web-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const [response] = await db
    .insert(responseTable)
    .values({
      entityType: "vacancy",
      entityId: vacancyId,
      candidateId: normalizedProfileUrl,
      resumeId: normalizedProfileUrl,
      profileUrl: freelancerInfo.platformProfileUrl
        ? normalizeProfileUrl(freelancerInfo.platformProfileUrl)
        : null,
      candidateName: freelancerInfo.name,
      phone: freelancerInfo.phone,
      email: freelancerInfo.email,
      telegramUsername: freelancerInfo.telegram,
      importSource: "WEB_LINK",
      status: "NEW",
      respondedAt: new Date(),
    })
    .returning();

  if (!response) {
    throw await errorHandler.handleInternalError(
      new Error("Failed to create response"),
      {
        vacancyId,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  return response;
}

export async function createGigResponse(
  db: Database,
  gigId: string,
  freelancerInfo: FreelancerInfo,
  errorHandler: ErrorHandler,
) {
  const normalizedCandidateId = freelancerInfo.platformProfileUrl
    ? normalizeProfileUrl(freelancerInfo.platformProfileUrl)
    : `web-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const [response] = await db
    .insert(responseTable)
    .values({
      entityType: "gig",
      entityId: gigId,
      candidateId: normalizedCandidateId,
      candidateName: freelancerInfo.name,
      profileUrl: freelancerInfo.platformProfileUrl,
      phone: freelancerInfo.phone,
      email: freelancerInfo.email,
      telegramUsername: freelancerInfo.telegram,
      contacts: {
        email: freelancerInfo.email,
        phone: freelancerInfo.phone,
        telegram: freelancerInfo.telegram,
      },
      importSource: "WEB_LINK",
      status: "NEW",
      respondedAt: new Date(),
    })
    .returning();

  if (!response) {
    throw await errorHandler.handleInternalError(
      new Error("Failed to create gig response"),
      {
        gigId,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  return response;
}
